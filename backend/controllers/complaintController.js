import Complaint from "../models/Complaint.js";
import getPool from "../config/postgres.js";
import { checkSLA } from "../utils/slaEngine.js";
import { analyzePriority } from "../utils/priorityEngine.js";
import {
	findSimilarComplaints,
	updateComplaintWithGroup,
} from "../utils/complaintClustering.js";
import logger from "../utils/logger.js";

export const createComplaint = async (req, res) => {
	try {
		// If frontend omitted citizenId, use authenticated user id (if available)
		const {
			category,
			subcategory,
			citizenId: bodyCitizenId,
			title,
			description,
			location,
		} = req.body;
		const citizenId =
			bodyCitizenId || (req.user && req.user.id ? req.user.id : undefined);

		// Validate required fields
		if (!category || !citizenId || !title || !description) {
			return res.status(400).json({
				error: "category, citizenId, title, and description are required",
			});
		}

		// Validate location is provided and has required fields
		if (!location) {
			return res.status(400).json({
				error: "Location is required",
			});
		}

		if (
			!location.coordinates ||
			location.coordinates.length !== 2 ||
			!location.address ||
			!(location.zipcode || location.pincode) ||
			!location.city
		) {
			return res.status(400).json({
				error: "Location must include coordinates, address, zipcode/pincode, and city",
			});
		}

		// Find responsible department
		const pool = getPool();
		const result = await pool.query(
			"SELECT * FROM departments WHERE $1 = ANY(category_handled)",
			[category]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				error: "No department found for this category",
				category: category,
			});
		}

		const dept = result.rows[0];

		// Create base complaint object
		const complaintData = {
			title,
			description,
			category,
			subcategory,
			citizen: citizenId,
			department: { pgDeptId: dept.id, name: dept.name },
			location: {
				type: "Point",
				coordinates: location.coordinates,
				address: location.address,
				landmark: location.landmark,
				zipcode: location.zipcode || location.pincode,
				city: location.city,
			},
		};

		// Analyze priority and calculate SLA
		const priorityAnalysis = await analyzePriority({
			title,
			description,
			category,
			location: complaintData.location,
		});

		// Add priority analysis results
		complaintData.priority = priorityAnalysis.priority;
		complaintData.slaHours = priorityAnalysis.slaHours;
		complaintData.meta = {
			priorityScore: priorityAnalysis.meta.priorityScore,
			mlPrediction: priorityAnalysis.meta.mlPrediction,
			mlConfidence: priorityAnalysis.meta.mlConfidence,
			textScore: priorityAnalysis.meta.textScore,
			timeScore: priorityAnalysis.meta.timeScore,
		};

		// Create and save the complaint
		const complaint = new Complaint(complaintData);
		await complaint.save();
		logger.info(`Complaint created: ${complaint._id}`);

		// Find similar complaints and update grouping information
		try {
			const similarGroup = await findSimilarComplaints(complaint);
			if (similarGroup) {
				logger.info(
					`Found similar group for complaint ${complaint._id}: group ${similarGroup.id} with ${similarGroup.complaints.length} complaints`
				);
				await updateComplaintWithGroup(complaint, similarGroup);
			}
		} catch (groupError) {
			logger.error("Error during complaint grouping:", groupError);
			// Continue even if grouping fails
		}

		// Build response
		const response = {
			message: "Complaint created successfully",
			complaint: complaint,
		};

		res.status(201).json(response);
	} catch (err) {
		res.status(400).json({
			error: err.message,
		});
	}
};

export const getComplaints = async (req, res) => {
	try {
		const complaints = await Complaint.find().populate("citizen", "name email");
		res.json(complaints);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

export const getUserComplaints = async (req, res) => {
	try {
		// Fix: Extract citizenId correctly from the JWT token payload
		const citizenId = req.user && req.user.id ? req.user.id : req.user;
		logger.info("Fetching complaints for citizen:", citizenId);

		// Add debugging
		logger.info("req.user object:", JSON.stringify(req.user, null, 2));

		const complaints = await Complaint.find({ citizen: citizenId })
			.sort({ createdAt: -1 }) // Most recent first
			.populate("citizen", "name email");

		logger.info(
			`Found ${complaints.length} complaints for citizen ${citizenId}`
		);
		res.json(complaints);
	} catch (err) {
		logger.error("Error fetching user complaints:", err);
		res.status(500).json({ error: err.message });
	}
};

export const runSLA = async (req, res) => {
	try {
		await checkSLA();
		res.json({ message: "SLA check completed" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

export const getComplaintAnalytics = async (req, res) => {
	try {
		// Get time range from query parameter (default: all time)
		const { timeRange = 'all' } = req.query;
		
		// Calculate date filter based on time range
		let dateFilter = {};
		const now = new Date();
		
		switch (timeRange) {
			case '1day':
				dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 1)) } };
				break;
			case '7days':
				dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
				break;
			case '15days':
				dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 15)) } };
				break;
			case '30days':
				dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
				break;
			case '6months':
				dateFilter = { createdAt: { $gte: new Date(now.setMonth(now.getMonth() - 6)) } };
				break;
			case '1year':
				dateFilter = { createdAt: { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) } };
				break;
			case 'all':
			default:
				dateFilter = {}; // No filter - show all time
				break;
		}

		// Get analytics from MongoDB with time filter
		const [
			priorityDistribution,
			categoryDistribution,
			averagePriorityScores,
			slaBreachStats,
			statusDistribution,
			groupingStats,
		] = await Promise.all([
			// Priority distribution
			Complaint.aggregate([
				{ $match: dateFilter },
				{
					$group: {
						_id: "$priority",
						count: { $sum: 1 },
					},
				},
				{ $sort: { count: -1 } }
			]),

			// Category distribution
			Complaint.aggregate([
				{ $match: dateFilter },
				{
					$group: {
						_id: "$category",
						count: { $sum: 1 },
						avgPriorityScore: { $avg: "$meta.priorityScore" },
					},
				},
				{ $sort: { count: -1 } }
			]),

			// Average priority scores by category
			Complaint.aggregate([
				{ $match: dateFilter },
				{
					$group: {
						_id: "$category",
						avgScore: { $avg: "$meta.priorityScore" },
						count: { $sum: 1 }
					},
				},
			]),

			// SLA breach statistics
			Complaint.aggregate([
				{ $match: dateFilter },
				{
					$group: {
						_id: "$category",
						totalComplaints: { $sum: 1 },
						slaBreaches: {
							$sum: { $cond: ["$meta.slaBreached", 1, 0] },
						},
					},
				},
			]),

			// Status distribution
			Complaint.aggregate([
				{ $match: dateFilter },
				{
					$group: {
						_id: "$status",
						count: { $sum: 1 },
					},
				},
				{ $sort: { count: -1 } }
			]),

			// Grouping statistics
			Complaint.aggregate([
				{ $match: dateFilter },
				{
					$group: {
						_id: null,
						totalComplaints: { $sum: 1 },
						groupedComplaints: {
							$sum: { $cond: [{ $gt: ["$groupSize", 1] }, 1, 0] },
						},
						totalGroups: { $sum: "$groupSize" },
					},
				},
				{
					$project: {
						_id: 0,
						totalComplaints: 1,
						groupedComplaints: 1,
						averageGroupSize: {
							$cond: [
								{ $gt: ["$groupedComplaints", 0] },
								{ $divide: ["$totalGroups", "$groupedComplaints"] },
								0,
							],
						},
					},
				},
			]),
		]);

		res.json({
			timeRange,
			priorityDistribution,
			categoryDistribution,
			averagePriorityScores,
			slaBreachStats,
			statusDistribution,
			groupingStats: groupingStats[0] || {
				totalComplaints: 0,
				groupedComplaints: 0,
				averageGroupSize: 0
			},
			summary: {
				totalComplaints: groupingStats[0]?.totalComplaints || 0,
				categories: categoryDistribution.length,
				highPriority: priorityDistribution.find(p => p._id === 'high')?.count || 0,
				mediumPriority: priorityDistribution.find(p => p._id === 'medium')?.count || 0,
				lowPriority: priorityDistribution.find(p => p._id === 'low')?.count || 0,
			}
		});
	} catch (err) {
		logger.error("Analytics error:", err);
		res.status(500).json({ error: err.message });
	}
};

export const getComplaintGroups = async (req, res) => {
	try {
		const { categoryId, limit = 10 } = req.query;

		// Find complaints that are part of groups (groupSize > 1)
		const matchQuery = { groupSize: { $gt: 1 } };
		if (categoryId) {
			matchQuery.category = categoryId;
		}

		const groups = await Complaint.aggregate([
			{ $match: matchQuery },
			{
				$group: {
					_id: "$groupId",
					complaints: { $push: "$$ROOT" },
					category: { $first: "$category" },
					count: { $sum: 1 },
					averagePriority: {
						$avg: {
							$switch: {
								branches: [
									{ case: { $eq: ["$priority", "high"] }, then: 3 },
									{ case: { $eq: ["$priority", "medium"] }, then: 2 },
									{ case: { $eq: ["$priority", "low"] }, then: 1 },
								],
								default: 0,
							},
						},
					},
					createdAt: { $max: "$createdAt" }, // Most recent complaint in group
				},
			},
			{ $sort: { count: -1, createdAt: -1 } },
			{ $limit: parseInt(limit) },
		]);

		res.json(groups);
	} catch (err) {
		logger.error("Error fetching complaint groups:", err);
		res.status(500).json({ error: err.message });
	}
};

// Get complaint hotspots for geospatial mapping with DBSCAN clustering
export const getComplaintHotspots = async (req, res) => {
    try {
        const { category, clustering = 'true' } = req.query;
        const matchStage = {};
        
        if (category) {
            matchStage.category = category;
        }

        // Get all complaints with location data and populate citizen information
        const complaints = await Complaint.find(
            matchStage
        )
        .populate('citizen', 'name email')
        .select('location priority category subcategory title description status meta.priorityScore createdAt updatedAt citizen')
        .lean();

        if (complaints.length === 0) {
            return res.json({
                type: "FeatureCollection",
                features: [],
                clusters: [],
                heatmap: []
            });
        }

        // Transform to GeoJSON format
        const geoJson = {
            type: "FeatureCollection",
            features: complaints.map(c => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: c.location.coordinates
                },
                properties: {
                    id: c._id,
                    title: c.title,
                    category: c.category,
                    priority: c.priority,
                    priorityScore: c.meta?.priorityScore || 0,
                    intensity: c.priority === 'high' ? 1 : (c.priority === 'medium' ? 0.6 : 0.3),
                    createdAt: c.createdAt
                }
            }))
        };

        let clusters = [];
        let heatmap = [];

        // Perform clustering if requested
        if (clustering === 'true') {
            try {
                const { dbscanClustering, generateHeatmap } = await import('../utils/geospatialClustering.js');
                
                // DBSCAN clustering (epsilon = 0.5km, minPts = 3)
                clusters = dbscanClustering(complaints, 0.5, 3);
                
                // Generate heatmap using KDE
                heatmap = generateHeatmap(complaints, 1.0);
                
                logger.info(`Identified ${clusters.length} hotspot clusters`);
            } catch (clusterError) {
                logger.error('Clustering error:', clusterError);
            }
        }

        res.json({
            ...geoJson,
            clusters,
            heatmap,
            meta: {
                total: complaints.length,
                clusterCount: clusters.length,
                heatmapPoints: heatmap.length
            }
        });
    } catch (err) {
        logger.error("Error fetching hotspots:", err);
        res.status(500).json({ error: err.message });
    }
};
