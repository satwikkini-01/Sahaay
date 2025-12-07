import stringSimilarity from "string-similarity";
import { similarity } from "@nlpjs/similarity";
import Complaint from "../models/Complaint.js";
import logger from "./logger.js";

// Earth radius in kilometers
const EARTH_RADIUS = 6371;

/**
 * Calculate the distance between two points using Haversine formula
 * @param {Array} coord1 - [longitude, latitude] of first point
 * @param {Array} coord2 - [longitude, latitude] of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(coord1, coord2) {
	const [lon1, lat1] = coord1;
	const [lon2, lat2] = coord2;

	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return EARTH_RADIUS * c;
}

/**
 * Extract text features from complaint for similarity comparison
 * @param {Object} complaint - Complaint object
 * @returns {string} Concatenated text features
 */
function extractTextFeatures(complaint) {
	// Include subcategory when available (frontend may send `subcategory`)
	const subcat = complaint.subcategory || complaint.subCategory || "";
	return `${complaint.title} ${complaint.description} ${complaint.category} ${subcat}`.toLowerCase();
}

// No longer using text similarity - grouping is purely by category → subcategory → location

/**
 * Group similar complaints within a radius
 * @param {Array} complaints - Array of complaint objects
 * @param {number} radiusKm - Radius in kilometers (default: 2km)
 * @param {number} similarityThreshold - Text similarity threshold (default: 0.6)
 * @returns {Array} Array of complaint groups
 */
export async function groupSimilarComplaints(complaints, radiusKm = 5) {
	logger.info(
		`groupSimilarComplaints called with ${complaints.length} complaints, radiusKm=${radiusKm}`
	);
	// Location-first grouping:
	// 1. Build location clusters by collecting complaints within radius of each complaint
	// 2. Within each location cluster, partition by category+subcategory and create groups
	const processedGlobal = new Set();
	const locationClusters = [];

	// Step 1: create location clusters
	for (let i = 0; i < complaints.length; i++) {
		const c = complaints[i];
		const idStr = c._id.toString();
		if (processedGlobal.has(idStr)) continue;

		const cluster = [c];
		processedGlobal.add(idStr);

		for (let j = i + 1; j < complaints.length; j++) {
			const o = complaints[j];
			const oid = o._id.toString();
			if (processedGlobal.has(oid)) continue;

			// Defensive: ensure coordinates are numbers and in [lon, lat] order
			const cCoords = Array.isArray(c.location?.coordinates)
				? c.location.coordinates.map(Number)
				: [0, 0];
			const oCoords = Array.isArray(o.location?.coordinates)
				? o.location.coordinates.map(Number)
				: [0, 0];
			const distance = calculateDistance(cCoords, oCoords);
			logger.debug(
				`pair-check: ${c._id} <-> ${o._id} => ${distance.toFixed(4)} km`
			);
			if (distance <= radiusKm) {
				cluster.push(o);
				processedGlobal.add(oid);
			}
		}

		locationClusters.push(cluster);
	}

	const groups = [];

	// Step 2: within each location cluster, partition by category+subcategory and build final groups
	for (const cluster of locationClusters) {
		// Partition by category+subcategory
		const map = new Map();
		for (const comp of cluster) {
			const cat = (comp.category || "uncategorized").toString();
			const sub = (comp.subcategory || comp.subCategory || "").toString();
			const key = `${cat}||${sub}`;
			if (!map.has(key)) map.set(key, []);
			map.get(key).push(comp);
		}

		// For each partition, if more than one complaint, create a group
		for (const [key, bucket] of map.entries()) {
			if (bucket.length === 0) continue;
			const group = {
				id: `${bucket[0]._id}`,
				center: calculateAverageLocation(bucket),
				complaints: bucket,
				category: bucket[0].category,
				subcategory: bucket[0].subcategory || bucket[0].subCategory || "",
				averageLocation: calculateAverageLocation(bucket),
			};

			groups.push(group);
		}
	}

	logger.info(`groupSimilarComplaints produced ${groups.length} groups`);
	return groups;
}

/**
 * Calculate average location of complaints in a group
 * @param {Array} complaints - Array of complaint objects
 * @returns {Array} [longitude, latitude] of average location
 */
function calculateAverageLocation(complaints) {
	if (complaints.length === 0) return [0, 0];

	const sum = complaints.reduce(
		(acc, complaint) => {
			acc.lon += complaint.location.coordinates[0];
			acc.lat += complaint.location.coordinates[1];
			return acc;
		},
		{ lon: 0, lat: 0 }
	);

	return [sum.lon / complaints.length, sum.lat / complaints.length];
}

/**
 * Extract keywords from complaint text
 * @param {Object} complaint - Complaint object
 * @returns {Array} Array of keywords
 */
function extractKeywords(complaint) {
	const text = extractTextFeatures(complaint);
	// Simple keyword extraction - in a real implementation, you might use NLP libraries
	const words = text.split(/\s+/).filter((word) => word.length > 3);
	const uniqueWords = [...new Set(words)];
	return uniqueWords.slice(0, 5); // Return top 5 unique words
}

/**
 * Find and group similar complaints in the database
 * @param {Object} newComplaint - Newly created complaint
 * @param {number} radiusKm - Radius in kilometers (default: 2km)
 * @param {number} similarityThreshold - Text similarity threshold (default: 0.6)
 * @returns {Promise<Object>} Group information
 */
export async function findSimilarComplaints(newComplaint, radiusKm = 5) {
	try {
		logger.info(
			`findSimilarComplaints for complaint ${newComplaint._id} radiusKm=${radiusKm}`
		);
		// Normalize and validate new complaint coordinates
		if (
			!newComplaint.location ||
			!Array.isArray(newComplaint.location.coordinates)
		) {
			logger.warn(
				`findSimilarComplaints: complaint ${newComplaint._id} missing coordinates`
			);
			return null;
		}
		const centerCoords = newComplaint.location.coordinates.map(Number);
		logger.debug(`findSimilarComplaints center coords: ${centerCoords}`);
		// Find complaints within the radius (location-first) — do not restrict by category here
		const nearbyComplaints = await Complaint.find({
			"location.coordinates": {
				$near: {
					$geometry: {
						type: "Point",
						coordinates: centerCoords,
					},
					$maxDistance: radiusKm * 1000, // Convert to meters
				},
			},
			_id: { $ne: newComplaint._id }, // Exclude the new complaint itself
			createdAt: {
				$gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
			},
		}).limit(100); // Limit for performance

		logger.info(`Found ${nearbyComplaints.length} nearby complaints from DB`);

		// Normalize coordinates and log each nearby complaint for debugging
		nearbyComplaints.forEach((nc) => {
			if (nc.location && Array.isArray(nc.location.coordinates)) {
				nc.location.coordinates = nc.location.coordinates.map(Number);
			}
			logger.debug(
				`nearby complaint id=${nc._id} cat=${nc.category} sub=${
					nc.subcategory || nc.subCategory || ""
				} coords=${nc.location.coordinates}`
			);
		});

		if (nearbyComplaints.length === 0) {
			return null;
		}

		// Group similar complaints
		const groups = await groupSimilarComplaints(
			[newComplaint, ...nearbyComplaints],
			radiusKm
		);
		const relevantGroup = groups.find((group) =>
			group.complaints.some(
				(c) => c._id.toString() === newComplaint._id.toString()
			)
		);

		return relevantGroup && relevantGroup.complaints.length > 1
			? relevantGroup
			: null;
	} catch (error) {
		console.error("Error finding similar complaints:", error);
		return null;
	}
}

/**
 * Update complaint with group information
 * @param {Object} complaint - Complaint object
 * @param {Object} group - Group information
 * @returns {Promise<void>}
 */
export async function updateComplaintWithGroup(complaint, group) {
	try {
		if (group) {
			// Update the complaint with group information
			complaint.groupId = group.id;
			complaint.groupSize = group.complaints.length;
			await complaint.save();
		}
	} catch (error) {
		console.error("Error updating complaint with group info:", error);
	}
}
