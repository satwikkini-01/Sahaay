import getPool from "../config/postgres.js";
import Department from "../models/Department.js";
import logger from "../utils/logger.js";

export const createDepartment = async (req, res) => {
	const { name, categoryHandled } = req.body;
	if (!name) return res.status(400).json({ error: "name is required" });
	const categories = Array.isArray(categoryHandled)
		? categoryHandled
		: [categoryHandled].filter(Boolean);

	try {
		const pool = getPool();
		const result = await pool.query(
			"INSERT INTO departments (name, category_handled) VALUES ($1, $2) RETURNING id",
			[name, categories]
		);

		const pgDeptId = result.rows[0].id;

		const dept = new Department({ pgDeptId, name, categoryHandled });
		await dept.save();

		logger.info("Department created:", { pgDeptId, name });

		res.status(201).json({ message: "Department created", dept });
	} catch (err) {
		logger.error("Department creation error:", err);
		res.status(400).json({ error: err.message });
	}
};

export const getDepartments = async (req, res) => {
	try {
		const pool = getPool();
		const result = await pool.query("SELECT * FROM departments");
		logger.info("Fetched departments, count:", result.rows.length);
		res.json(result.rows);
	} catch (err) {
		logger.error("Error fetching departments:", err);
		res.status(500).json({ error: err.message });
	}
};
