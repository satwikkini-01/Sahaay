import getPool from "../config/postgres.js";
import Department from "../models/Department.js";

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

		res.status(201).json({ message: "Department created", dept });
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
};

export const getDepartments = async (req, res) => {
	try {
		const pool = getPool();
		const result = await pool.query("SELECT * FROM departments");
		res.json(result.rows);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
