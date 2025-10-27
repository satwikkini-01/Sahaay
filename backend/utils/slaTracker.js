import Complaint from "../models/Complaint.js";
import Department from "../models/Department.js";
import getPool from "../config/postgres.js";
import logger from "./logger.js";

export const runSLACheck = async () => {
	try {
		const now = new Date();
		const openComplaints = await Complaint.find({
			status: { $ne: "resolved" },
		});

		for (const c of openComplaints) {
			if (c.slaDeadline && c.slaDeadline < now) {
				if (!c.meta?.slaBreached) {
					c.meta = { ...c.meta, slaBreached: true, slaBreachedAt: now };
					await c.save();
					logger.warn(`SLA breached for complaint ${c._id} (${c.category})`);
					const pool = getPool();
					if (pool) {
						await pool.query(
							`INSERT INTO metrics (category, priority, sla_breached, created_at) VALUES ($1,$2,$3,$4)`,
							[c.category, c.priority, true, now]
						);
					}
				}
			}
		}
	} catch (err) {
		logger.error("SLA check error:", err.message);
	}
};
