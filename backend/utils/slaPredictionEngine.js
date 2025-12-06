import Complaint from "../models/Complaint.js";
import logger from "./logger.js";

/**
 * Predict SLA breach probability based on historical data
 */
export async function predictSLABreach(complaint) {
    try {
        const { category, priority, department } = complaint;

        // Get historical data for similar complaints
        const historicalComplaints = await Complaint.find({
            category,
            priority,
            status: "resolved",
            createdAt: {
                $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
        }).limit(100);

        if (historicalComplaints.length < 5) {
            return {
                breachProbability: 0.3, // Default moderate risk
                estimatedResolutionHours: complaint.slaHours || 24,
                confidence: 0.3,
                reason: "Insufficient historical data",
            };
        }

        // Calculate average resolution time
        const resolutionTimes = historicalComplaints.map((c) => {
            const created = c.createdAt || c._id.getTimestamp();
            const resolved = c.updatedAt || c.createdAt;
            return (resolved - created) / (1000 * 60 * 60); // hours
        });

        const avgResolutionTime =
            resolutionTimes.reduce((sum, time) => sum + time, 0) /
            resolutionTimes.length;

        // Calculate breach rate
        const breachedCount = historicalComplaints.filter((c) => {
            const created = c.createdAt || c._id.getTimestamp();
            const resolved = c.updatedAt || c.createdAt;
            const timeTaken = (resolved - created) / (1000 * 60 * 60);
            return timeTaken > (c.slaHours || 24);
        }).length;

        const breachRate = breachedCount / historicalComplaints.length;

        // Adjust probability based on current factors
        let adjustedProbability = breachRate;

        // Increase probability if current SLA is tighter than average resolution time
        if (complaint.slaHours < avgResolutionTime) {
            adjustedProbability += 0.2;
        }

        // Increase probability during weekends
        const now = new Date();
        if (now.getDay() === 0 || now.getDay() === 6) {
            adjustedProbability += 0.1;
        }

        // Increase probability during off-hours
        const hour = now.getHours();
        if (hour < 8 || hour > 20) {
            adjustedProbability += 0.1;
        }

        // Cap probability between 0 and 1
        adjustedProbability = Math.min(1, Math.max(0, adjustedProbability));

        return {
            breachProbability: adjustedProbability,
            estimatedResolutionHours: avgResolutionTime,
            confidence: Math.min(1, historicalComplaints.length / 50),
            historicalBreachRate: breachRate,
            sampleSize: historicalComplaints.length,
            reason: `Based on ${historicalComplaints.length} similar complaints`,
        };
    } catch (error) {
        logger.error("Error predicting SLA breach:", error);
        return {
            breachProbability: 0.3,
            estimatedResolutionHours: 24,
            confidence: 0,
            reason: "Error in prediction",
        };
    }
}

/**
 * Get early warning for potential SLA breach
 */
export async function checkEarlyWarning(complaintId) {
    try {
        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            return null;
        }

        const now = new Date();
        const created = complaint.createdAt || complaint._id.getTimestamp();
        const hoursPassed = (now - created) / (1000 * 60 * 60);
        const hoursRemaining = (complaint.slaHours || 24) - hoursPassed;

        // Get breach prediction
        const prediction = await predictSLABreach(complaint);

        // Determine warning level
        let warningLevel = "none";
        let message = "";

        if (hoursRemaining < 0) {
            warningLevel = "breached";
            message = `SLA already breached by ${Math.abs(
                hoursRemaining
            ).toFixed(1)} hours`;
        } else if (hoursRemaining < 2) {
            warningLevel = "critical";
            message = `Only ${hoursRemaining.toFixed(
                1
            )} hours remaining until SLA breach`;
        } else if (hoursRemaining < complaint.slaHours * 0.25) {
            warningLevel = "high";
            message = `${hoursRemaining.toFixed(1)} hours remaining (${(
                (hoursRemaining / complaint.slaHours) *
                100
            ).toFixed(0)}% of SLA)`;
        } else if (prediction.breachProbability > 0.7) {
            warningLevel = "medium";
            message = `High breach probability (${(
                prediction.breachProbability * 100
            ).toFixed(0)}%)`;
        }

        return {
            complaintId: complaint._id,
            warningLevel,
            message,
            hoursPassed: hoursPassed.toFixed(1),
            hoursRemaining: hoursRemaining.toFixed(1),
            slaHours: complaint.slaHours,
            prediction,
        };
    } catch (error) {
        logger.error("Error checking early warning:", error);
        return null;
    }
}

/**
 * Get all complaints at risk of SLA breach
 */
export async function getAtRiskComplaints() {
    try {
        const openComplaints = await Complaint.find({
            status: { $ne: "resolved" },
        });

        const atRisk = [];

        for (const complaint of openComplaints) {
            const warning = await checkEarlyWarning(complaint._id);
            if (warning && warning.warningLevel !== "none") {
                atRisk.push(warning);
            }
        }

        // Sort by warning level priority
        const levelPriority = { breached: 0, critical: 1, high: 2, medium: 3 };
        atRisk.sort(
            (a, b) =>
                levelPriority[a.warningLevel] - levelPriority[b.warningLevel]
        );

        return atRisk;
    } catch (error) {
        logger.error("Error getting at-risk complaints:", error);
        return [];
    }
}

/**
 * Calculate recommended SLA hours based on historical data
 */
export async function recommendSLAHours(category, priority) {
    try {
        const historicalComplaints = await Complaint.find({
            category,
            priority,
            status: "resolved",
            createdAt: {
                $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
        }).limit(200);

        if (historicalComplaints.length < 10) {
            // Default SLA hours
            const defaults = {
                high: 4,
                medium: 12,
                low: 48,
            };
            return defaults[priority] || 24;
        }

        // Calculate resolution times
        const resolutionTimes = historicalComplaints.map((c) => {
            const created = c.createdAt || c._id.getTimestamp();
            const resolved = c.updatedAt || c.createdAt;
            return (resolved - created) / (1000 * 60 * 60);
        });

        // Use 75th percentile as recommended SLA (ensures 75% completion rate)
        resolutionTimes.sort((a, b) => a - b);
        const percentile75Index = Math.floor(resolutionTimes.length * 0.75);
        const recommendedHours = Math.ceil(resolutionTimes[percentile75Index]);

        return recommendedHours;
    } catch (error) {
        logger.error("Error recommending SLA hours:", error);
        return 24;
    }
}
