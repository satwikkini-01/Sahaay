import Complaint from "../models/Complaint.js";
import getPool from "../config/postgres.js";

export const checkSLA = async () => {
	try {
		const now = new Date();
		const open = await Complaint.find({ status: { $ne: "resolved" } });

		for (const c of open) {
			const created = c.createdAt || c._id.getTimestamp();
			const hoursPassed = (now - created) / (1000 * 60 * 60);

			if (c.slaHours && hoursPassed > c.slaHours && c.status !== "escalated") {
				c.status = "escalated";
				c.escalationLevel = (c.escalationLevel || 0) + 1;
				c.meta = { ...c.meta, slaBreachedAt: now };
				await c.save();

				const pool = getPool();
				if (pool) {
					await pool.query(
						`CREATE TABLE IF NOT EXISTS escalations (
			  id SERIAL PRIMARY KEY,
			  complaint_id TEXT,
			  title TEXT,
			  category TEXT,
			  created_at TIMESTAMP,
			  escalation_time TIMESTAMP,
			  escalation_level INT
			);`
					);
					await pool.query(
						`INSERT INTO escalations (complaint_id, title, category, created_at, escalation_time, escalation_level)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
						[
							String(c._id),
							c.title,
							c.category,
							created,
							now,
							c.escalationLevel,
						]
					);
				}
			}
		}
	} catch (err) {
		console.error("checkSLA error:", err);
		throw err;
	}
};
