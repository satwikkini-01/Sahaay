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
			!location.zipcode ||
			!location.city
		) {
			return res.status(400).json({
				error: "Location must include coordinates, address, zipcode, and city",
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
				zipcode: location.zipcode,
				city: location.city,
			},
		};

		// Analyze priority and calculate SLA
		const priorityAnalysis = await analyzePriority({
			title,
			description,
			location: complaintData.location,
		});

		// Add priority analysis results
		complaintData.priority = priorityAnalysis.priority;
		complaintData.slaHours = priorityAnalysis.slaHours;
		complaintData.meta = {
			priorityScore: priorityAnalysis.meta.priorityScore,
			priorityFactors: priorityAnalysis.meta.factors,
		};

		// Calculate SLA deadline
		const slaDeadline = new Date();
		slaDeadline.setHours(slaDeadline.getHours() + priorityAnalysis.slaHours);
		complaintData.slaDeadline = slaDeadline;

		// Create and save complaint
		const complaint = new Complaint(complaintData);
		await complaint.save();

		// Find similar complaints and group them
		const similarGroup = await findSimilarComplaints(complaint);

		if (similarGroup) {
			// Update all complaints in the group
			for (const similarComplaint of similarGroup.complaints) {
				await updateComplaintWithGroup(similarComplaint, similarGroup);
			}
		} else {
			// Update this complaint with its own group
			await updateComplaintWithGroup(complaint, {
				id: complaint._id.toString(),
				complaints: [complaint],
			});
		}

		// Return detailed response
		const response = {
			message: "Complaint filed and routed",
			complaint,
			analysis: {
				priority: priorityAnalysis.priority,
				slaHours: priorityAnalysis.slaHours,
				slaDeadline: slaDeadline,
				factors: priorityAnalysis.meta.factors,
			},
			groupInfo: similarGroup
				? {
						groupId: similarGroup.id,
						groupSize: similarGroup.complaints.length,
						isPartOfExistingGroup: similarGroup.complaints.length > 1,
				  }
				: null,
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
		const now = new Date();
		const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

		// Get analytics from MongoDB
		const [
			priorityDistribution,
			averagePriorityScores,
			slaBreachStats,
			categoryTrends,
			groupingStats,
		] = await Promise.all([
			// Priority distribution
			Complaint.aggregate([
				{ $match: { createdAt: { $gte: thirtyDaysAgo } } },
				{
					$group: {
						_id: "$priority",
						count: { $sum: 1 },
					},
				},
			]),

			// Average priority scores by category
			Complaint.aggregate([
				{ $match: { createdAt: { $gte: thirtyDaysAgo } } },
				{
					$group: {
						_id: "$category",
						avgScore: { $avg: "$meta.priorityScore" },
						textScore: { $avg: "$meta.priorityFactors.textScore" },
						timeScore: { $avg: "$meta.priorityFactors.timeScore" },
						weatherScore: { $avg: "$meta.priorityFactors.weatherScore" },
					},
				},
			]),

			// SLA breach statistics
			Complaint.aggregate([
				{ $match: { createdAt: { $gte: thirtyDaysAgo } } },
				{
					$group: {
						_id: "$category",
						totalComplaints: { $sum: 1 },
						slaBreaches: {
							$sum: { $cond: [{ $eq: ["$meta.slaBreached", true] }, 1, 0] },
						},
					},
				},
			]),

			// Category trends over time
			Complaint.aggregate([
				{ $match: { createdAt: { $gte: thirtyDaysAgo } } },
				{
					$group: {
						_id: {
							category: "$category",
							week: { $week: "$createdAt" },
						},
						count: { $sum: 1 },
					},
				},
			]),

			// Grouping statistics
			Complaint.aggregate([
				{ $match: { createdAt: { $gte: thirtyDaysAgo } } },
				{
					$group: {
						_id: null,
						totalComplaints: { $sum: 1 },
						groupedComplaints: {
							$sum: { $cond: [{ $gt: ["$groupSize", 1] }, 1, 0] },
						},
						averageGroupSize: { $avg: "$groupSize" },
					},
				},
			]),
		]);

		// Get analytics from PostgreSQL
		const pool = getPool();
		const result = await pool.query(`
            SELECT 
                category,
                COUNT(*) as total_incidents,
                AVG(CASE WHEN sla_breached THEN 1 ELSE 0 END) as breach_rate,
                AVG(time_taken) as avg_resolution_time
            FROM metrics
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY category
        `);

		res.json({
			priorityDistribution,
			averagePriorityScores,
			slaBreachStats,
			categoryTrends,
			groupingStats,
			metricsFromPostgres: result.rows,
			timeRange: {
				from: thirtyDaysAgo,
				to: new Date(),
			},
		});
	} catch (err) {
		logger.error("Analytics error:", err);
		res.status(500).json({ error: err.message });
	}
};

// New endpoint to get complaint groups
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
