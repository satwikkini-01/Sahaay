import Complaint from "../models/Complaint.js";
import logger from "./logger.js";

// Run every 5 minutes
const INTERVAL_MS = 5 * 60 * 1000;

async function checkSLA() {
	const now = new Date();
	// Find all complaints not resolved or already escalated
	const complaints = await Complaint.find({
		status: { $nin: ["resolved", "escalated"] },
		meta: { $exists: true },
	});

	for (const c of complaints) {
		// Calculate SLA deadline
		const deadline = new Date(c.createdAt);
		deadline.setHours(deadline.getHours() + (c.slaHours || 24));
		if (now > deadline && !c.meta.slaBreached) {
			c.status = "escalated";
			c.meta.slaBreached = true;
			c.meta.slaBreachedAt = now;
			await c.save();
			logger.warn(`SLA breached for complaint ${c._id} (${c.title})`);
			// Optionally, log to Postgres metrics/escalations here
		}
	}
}

export function startSLAWatcher() {
	setInterval(checkSLA, INTERVAL_MS);
	logger.info(
		"SLA watcher started (interval: " + INTERVAL_MS / 60000 + " min)"
	);
}
