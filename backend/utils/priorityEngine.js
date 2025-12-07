import { predictPriority } from "./mlPriorityEngine.js";
import logger from "./logger.js";

// Category-specific critical issues with priority weights
const CATEGORY_CRITICAL_ISSUES = {
    water: {
        critical: [
            // 100 points
            "burst pipeline",
            "major leak",
            "no water supply",
            "contamination",
            "sewage overflow",
        ],
        high: [
            // 70 points
            "low pressure",
            "pipeline damage",
            "water quality",
            "pump failure",
            "drainage block",
        ],
        medium: [
            // 40 points
            "leakage",
            "irregular supply",
            "meter issues",
            "billing",
            "connection issue",
        ],
    },
    electricity: {
        critical: [
            "power outage",
            "live wire",
            "transformer failure",
            "electric shock",
            "fire",
        ],
        high: [
            "frequent cuts",
            "voltage issue",
            "sparking",
            "cable damage",
            "meter burning",
        ],
        medium: [
            "street light",
            "connection problem",
            "billing",
            "meter issues",
            "installation",
        ],
    },
    roads: {
        critical: [
            "major accident",
            "road collapse",
            "bridge damage",
            "traffic signal failure",
            "flooding",
        ],
        high: [
            "large pothole",
            "traffic jam",
            "signal malfunction",
            "road damage",
            "fallen tree",
        ],
        medium: [
            "small pothole",
            "street light",
            "road marking",
            "sign board",
            "minor repairs",
        ],
    },
    rail: {
        critical: [
            "track damage",
            "signal failure",
            "accident",
            "barrier failure",
            "power issue",
        ],
        high: [
            "track flooding",
            "platform damage",
            "overhead line",
            "crossing issue",
            "rail crack",
        ],
        medium: [
            "amenity issue",
            "ticket system",
            "cleaning",
            "parking",
            "general repair",
        ],
    },
};

// High-impact locations that increase priority
const CRITICAL_LOCATIONS = [
    // Emergency Services (100 points)
    "hospital",
    "emergency",
    "ambulance",
    "fire station",
    "police station",
    "disaster response",

    // Critical Infrastructure (80 points)
    "power station",
    "water plant",
    "metro station",
    "railway station",
    "airport",
    "bus terminal",

    // Public Services (60 points)
    "school",
    "college",
    "government office",
    "bank",
    "post office",
    "public office",

    // High-Density Areas (40 points)
    "market",
    "mall",
    "commercial area",
    "business district",
    "residential complex",
    "apartment",
];

// Calculate text-based priority score (0-100)
const analyzeText = (title, description, category) => {
    const text = `${title} ${description}`.toLowerCase();
    let score = 0;
    const normalizedCategory = category.toLowerCase();

    // Category-specific scoring
    if (CATEGORY_CRITICAL_ISSUES[normalizedCategory]) {
        // Check critical issues (100 points)
        const criticalMatch = CATEGORY_CRITICAL_ISSUES[
            normalizedCategory
        ].critical.some((issue) => text.includes(issue.toLowerCase()));
        if (criticalMatch) score = 100;

        // Check high priority issues (70 points) if not already critical
        if (!criticalMatch) {
            const highMatch = CATEGORY_CRITICAL_ISSUES[
                normalizedCategory
            ].high.some((issue) => text.includes(issue.toLowerCase()));
            if (highMatch) score = 70;
        }

        // Check medium priority issues (40 points) if not higher
        if (score === 0) {
            const mediumMatch = CATEGORY_CRITICAL_ISSUES[
                normalizedCategory
            ].medium.some((issue) => text.includes(issue.toLowerCase()));
            if (mediumMatch) score = 40;
        }
    }

    // Location-based priority boost
    const locationScore = CRITICAL_LOCATIONS.reduce((acc, location) => {
        if (text.includes(location.toLowerCase())) {
            // Emergency services locations
            if (
                location.match(
                    /hospital|emergency|ambulance|fire station|police/i
                )
            ) {
                return Math.max(acc, 100);
            }
            // Critical infrastructure
            if (
                location.match(
                    /power station|water plant|metro|railway|airport/i
                )
            ) {
                return Math.max(acc, 80);
            }
            // Public services
            if (location.match(/school|college|government|bank|post office/i)) {
                return Math.max(acc, 60);
            }
            // High-density areas
            return Math.max(acc, 40);
        }
        return acc;
    }, 0);

    // Combine scores: Take the highest of category-based and location-based scores
    score = Math.max(score, locationScore);

    // Additional boosts for urgent keywords
    if (text.includes("urgent") || text.includes("emergency")) {
        score = Math.min(100, score + 20);
    }

    return score;
};

// Calculate time-based priority factors
const analyzeTimeFactors = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    let score = 0;

    // Peak hours (8 AM - 8 PM) get higher priority
    if (hour >= 8 && hour <= 20) {
        score += 20;
    }

    // Weekends get slightly higher priority due to reduced staff
    if (day === 0 || day === 6) {
        score += 10;
    }

    return score;
};

// Calculate SLA hours based on final priority score and category
const calculateSLAHours = (priorityScore, category) => {
    // Base SLA hours by category
    const baseSLA = {
        water: {
            high: 2,
            medium: 6,
            low: 24,
        },
        electricity: {
            high: 2,
            medium: 6,
            low: 24,
        },
        roads: {
            high: 4,
            medium: 12,
            low: 48,
        },
    }[category.toLowerCase()] || {
        high: 4,
        medium: 12,
        low: 48,
    };

    if (priorityScore >= 80) return baseSLA.high;
    if (priorityScore >= 40) return baseSLA.medium;
    return baseSLA.low;
};

const getPriorityScore = (priority) => {
    const scoreMap = { high: 85, medium: 50, low: 20 };
    return scoreMap[priority] || 50;
};

const determinePriority = (score) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
};

const determineSLA = (score) => {
    if (score >= 80) return 4;
    if (score >= 60) return 12;
    if (score >= 40) return 24;
    return 48;
};

export const analyzePriority = async (complaint) => {
	try {
		// ML-based priority prediction
		const mlResult = predictPriority(complaint);
		const mlScore = getPriorityScore(mlResult.priority);

		// Rule-based text analysis
		const textScore = analyzeText(
			complaint.description,
			complaint.title,
			complaint.category
		);

		// Time-based factors
		const timeScore = analyzeTimeFactors();

		// Combined scoring (50% ML, 50% Rule-based)
		const ML_WEIGHT = 0.5;
		const RULE_WEIGHT = 0.5;
		const combinedScore = Math.min(
			100,
			mlScore * ML_WEIGHT + (textScore + timeScore) * RULE_WEIGHT
		);

		const priority = determinePriority(combinedScore);
		const slaHours = determineSLA(combinedScore);

		// ===============================================
		// DEMONSTRATION LOGGING (Faculty Demo)
		// ===============================================
		console.log('\n' + '='.repeat(80));
		console.log('🤖 ML PRIORITY ANALYSIS - COMPLAINT PROCESSED');
		console.log('='.repeat(80));
		console.log(`📝 Complaint: "${complaint.title?.substring(0, 60)}..."`);
		console.log(`📂 Category: ${complaint.category || 'N/A'}`);
		console.log('\n--- ML ENSEMBLE PREDICTION ---');
		console.log(`🎯 Predicted Priority: ${mlResult.priority.toUpperCase()} (Confidence: ${(mlResult.confidence * 100).toFixed(1)}%)`);
		console.log(`📊 Confidence Scores: High=${(mlResult.confidenceScores.high * 100).toFixed(0)}% | Medium=${(mlResult.confidenceScores.medium * 100).toFixed(0)}% | Low=${(mlResult.confidenceScores.low * 100).toFixed(0)}%`);
		console.log(`🔍 Feature Analysis:`);
		console.log(`   • Urgency Score: ${(parseFloat(mlResult.features.urgencyScore) * 100).toFixed(0)}%`);
		console.log(`   • Impact Score: ${(parseFloat(mlResult.features.impactScore) * 100).toFixed(0)}%`);
		console.log(`   • Safety Score: ${(parseFloat(mlResult.features.safetyScore) * 100).toFixed(0)}%`);
		console.log(`   • TF-IDF Score: ${(parseFloat(mlResult.features.tfIdfScore) * 100).toFixed(0)}%`);
		
		console.log('\n--- RULE-BASED ANALYSIS ---');
		console.log(`📏 Text Analysis Score: ${textScore.toFixed(1)}/100`);
		console.log(`⏰ Time Factor Score: ${timeScore.toFixed(1)}/30`);
		
		console.log('\n--- FINAL DECISION (Ensemble) ---');
		console.log(`⚖️  Combined Score: ${combinedScore.toFixed(1)}/100 (ML: ${(ML_WEIGHT * 100)}% + Rules: ${(RULE_WEIGHT * 100)}%)`);
		console.log(`🏆 Final Priority: ${priority.toUpperCase()}`);
		console.log(`⏱️  SLA Deadline: ${slaHours} hours`);
		console.log('='.repeat(80) + '\n');

		return {
			score: combinedScore,
			priority,
			slaHours,
			meta: {
				priorityScore: Math.round(combinedScore),
				mlPrediction: mlResult.priority,
				mlConfidence: mlResult.confidence,
				mlFeatures: mlResult.features,
				textScore,
				timeScore,
				explanation: mlResult.explanation,
			},
		};
	} catch (error) {
		logger.error("Error in priority analysis:", error);
		return {
			score: 50,
			priority: "medium",
			slaHours: 24,
			meta: { error: error.message },
		};
	}
};
