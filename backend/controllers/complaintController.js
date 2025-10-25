import Complaint from "../models/Complaint.js";
import getPool from "../config/postgres.js";
import { checkSLA } from "../utils/slaEngine.js";

export const createComplaint = async (req, res) => {
	try {
		const { category, citizenId } = req.body;
		if (!category || !citizenId)
			return res
				.status(400)
				.json({ error: "category and citizenId are required" });

		const pool = getPool();
		const result = await pool.query(
			"SELECT * FROM departments WHERE $1 = ANY(category_handled)",
			[category]
		);

		if (result.rows.length === 0)
			return res
				.status(404)
				.json({ error: "No department found for this category" });

		const dept = result.rows[0];

		const complaint = new Complaint({
			title: req.body.title,
			description: req.body.description,
			category,
			priority: req.body.priority || "medium",
			...req.body,
			citizen: citizenId,
			department: { pgDeptId: dept.id, name: dept.name },
		});

		await complaint.save();
		res.status(201).json({ message: "Complaint filed and routed", complaint });
	} catch (err) {
		res.status(400).json({ error: err.message });
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

export const runSLA = async (req, res) => {
	try {
		await checkSLA();
		res.json({ message: "SLA check completed" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
