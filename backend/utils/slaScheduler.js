import Complaint from "../models/Complaint.js";
import logger from "./logger.js";

// Run every 5 minutes
const INTERVAL_MS = 5 * 60 * 1000;

// Escalation thresholds (hours after initial SLA breach)
const LEVEL_2_THRESHOLD = 4;  // Department Head: 4h after Level 1
const LEVEL_3_THRESHOLD = 24; // Commissioner: 24h after Level 1
const PREDICTIVE_WARNING = 6;  // Warn 6h before SLA breach

async function checkSLA() {
	const now = new Date();
	
    // Find all active complaints (not resolved)
	const complaints = await Complaint.find({
		status: { $nin: ["resolved"] },
		meta: { $exists: true },
	});

	logger.info(`Checking SLA for ${complaints.length} active complaints`);

	for (const c of complaints) {
		try {
			const deadline = new Date(c.createdAt);
			deadline.setHours(deadline.getHours() + (c.slaHours || 24));
			
			const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
			const hoursAfterBreach = (now - deadline) / (1000 * 60 * 60);

			// Predictive Warning (6 hours before SLA breach)
			if (hoursUntilDeadline > 0 && hoursUntilDeadline <= PREDICTIVE_WARNING && !c.meta.predictiveWarning) {
				c.meta.predictiveWarning = true;
				c.meta.predictiveWarningAt = now;
				await c.save();
				logger.warn(`⚠️  PREDICTIVE WARNING: Complaint ${c._id} likely to breach SLA in ${hoursUntilDeadline.toFixed(1)}h`);
				// In production: Send notification to department
			}

			// Level 1: Initial SLA Breach
			if (now > deadline && !c.meta.slaBreached) {
				c.meta.slaBreached = true;
				c.meta.slaBreachedAt = now;
				c.escalationLevel = 1;
				c.status = "escalated";
				await c.save();
				logger.warn(`🔴 SLA BREACH Level 1: Complaint ${c._id} (${c.title}) - Assigned Department notified`);
			}
			// Level 2: Department Head Escalation (4h after breach)
			else if (c.meta.slaBreached && c.escalationLevel === 1 && hoursAfterBreach >= LEVEL_2_THRESHOLD) {
				c.escalationLevel = 2;
				c.meta.level2EscalationAt = now;
				await c.save();
				logger.error(`🔴🔴 SLA BREACH Level 2: Complaint ${c._id} escalated to Department Head`);
			}
			// Level 3: Commissioner Escalation (24h after breach)
			else if (c.escalationLevel === 2 && hoursAfterBreach >= LEVEL_3_THRESHOLD) {
				c.escalationLevel = 3;
				c.meta.level3EscalationAt = now;
				await c.save();
				logger.error(`🔴🔴🔴 SLA BREACH Level 3: Complaint ${c._id} escalated to City Commissioner - CRITICAL`);
				// In production: Send high-priority notification
			}
		} catch (error) {
			logger.error(`Error processing complaint ${c._id}:`, error);
		}
	}

	// Log summary statistics
	const breached = complaints.filter(c => c.meta?.slaBreached).length;
	const level2 = complaints.filter(c => c.escalationLevel >= 2).length;
	const level3 = complaints.filter(c => c.escalationLevel >= 3).length;
	
	if (breached > 0) {
		logger.info(`SLA Summary: ${breached} breached (L2: ${level2}, L3: ${level3})`);
	}
}

export function startSLAWatcher() {
	// Run immediately on startup
	checkSLA().catch(err => logger.error('Initial SLA check failed:', err));
	
	// Then run on interval
	setInterval(checkSLA, INTERVAL_MS);
	logger.info(`SLA watcher started (interval: ${INTERVAL_MS / 60000} min, predictive: ${PREDICTIVE_WARNING}h)`);
}

export { checkSLA };
