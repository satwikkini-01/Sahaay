import Complaint from "../models/Complaint.js";
import getPool from "../config/postgres.js";
import { checkSLA } from "../utils/slaEngine.js";
import { analyzePriority } from "../utils/priorityEngine.js";
import logger from "../utils/logger.js";

export const createComplaint = async (req, res) => {
	try {
		logger.info("Received complaint creation request:", req.body);

		// If frontend omitted citizenId, use authenticated user id (if available)
		const {
			category,
			citizenId: bodyCitizenId,
			title,
			description,
			location,
		} = req.body;
		const citizenId =
			bodyCitizenId || (req.user && req.user.id ? req.user.id : undefined);

		// Validate required fields
		if (!category || !citizenId || !title || !description) {
			logger.warn("Validation failed - Missing required fields:", {
				category,
				citizenId,
				title,
				description,
			});
			return res.status(400).json({
				error: "category, citizenId, title, and description are required",
				received: { category, citizenId, title, description },
			});
		}

		// Find responsible department
		const pool = getPool();
		logger.info("Searching for department handling category:", category);
		const result = await pool.query(
			"SELECT * FROM departments WHERE $1 = ANY(category_handled)",
			[category]
		);

		if (result.rows.length === 0) {
			logger.warn("No department found for category:", category);
			return res.status(404).json({
				error: "No department found for this category",
				category: category,
			});
		}
		logger.info("Found department:", result.rows[0]);

		const dept = result.rows[0];

		// Create base complaint object
		const complaintData = {
			title,
			description,
			category,
			citizen: citizenId,
			department: { pgDeptId: dept.id, name: dept.name },
		};

		// Add location if provided
		if (location) {
			complaintData.location = {
				type: "Point",
				coordinates: location.coordinates,
				address: location.address,
				landmark: location.landmark,
				zipcode: location.zipcode,
			};
		}

		// Analyze priority and calculate SLA
		logger.info("Analyzing complaint priority...");
		const priorityAnalysis = await analyzePriority({
			title,
			description,
			location: complaintData.location,
		});
		logger.info("Priority analysis completed:", priorityAnalysis);

		// Add priority analysis results
		complaintData.priority = priorityAnalysis.priority;
		complaintData.slaHours = priorityAnalysis.slaHours;
		complaintData.meta = {
			priorityScore: priorityAnalysis.meta.priorityScore,
			priorityFactors: priorityAnalysis.meta.factors,
		};
		logger.debug(
			"Updated complaint data with priority information:",
			complaintData
		);

		// Calculate SLA deadline
		const slaDeadline = new Date();
		slaDeadline.setHours(slaDeadline.getHours() + priorityAnalysis.slaHours);
		complaintData.slaDeadline = slaDeadline;

		// Create and save complaint
		logger.info("Creating new complaint in database...");
		const complaint = new Complaint(complaintData);
		await complaint.save();
		logger.info("Complaint saved successfully:", complaint._id);

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
		};
		logger.info("Sending success response for complaint:", complaint._id);
		res.status(201).json(response);
	} catch (err) {
		logger.error("Complaint creation error:", {
			error: err,
			stack: err.stack,
			requestBody: req.body,
		});
		res.status(400).json({
			error: err.message,
			details: process.env.NODE_ENV === "development" ? err.stack : undefined,
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
		const citizenId = req.user && req.user.id ? req.user.id : req.user;
		logger.info("Fetching complaints for citizen:", citizenId);
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
