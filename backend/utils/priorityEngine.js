import { mlPredictPriority } from "./mlPriorityEngine.js";
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
            high: 2, // 2 hours for high priority water issues
            medium: 6, // 6 hours for medium priority
            low: 24, // 24 hours for low priority
        },
        electricity: {
            high: 2, // 2 hours for power issues
            medium: 6,
            low: 24,
        },
        roads: {
            high: 4, // 4 hours for critical road issues
            medium: 12,
            low: 48,
        },
        rail: {
            high: 1, // 1 hour for rail safety issues
            medium: 4,
            low: 24,
        },
    }[category.toLowerCase()] || {
        high: 4,
        medium: 12,
        low: 48,
    };

    if (priorityScore >= 80) {
        return baseSLA.high;
    } else if (priorityScore >= 40) {
        return baseSLA.medium;
    } else {
        return baseSLA.low;
    }
};

export const analyzePriority = async (complaint) => {
    try {
        logger.info("Analyzing priority for complaint...");

        // 1. Get ML-based priority prediction
        const mlResult = mlPredictPriority(complaint);
        logger.info(`ML Priority: ${mlResult.priority}`);

        // Convert ML priority to score (0-100)
        const mlScoreMap = { high: 85, medium: 50, low: 20 };
        const mlScore = mlScoreMap[mlResult.priority] || 50;

        // 2. Calculate rule-based score
        const textScore = analyzeText(
            complaint.title || "",
            complaint.description || "",
            complaint.category || "general"
        );
        const timeScore = analyzeTimeFactors();
        const ruleBasedScore = Math.min(100, textScore + timeScore);
        logger.info(
            `Rule-based score: ${ruleBasedScore} (text: ${textScore}, time: ${timeScore})`
        );

        // 3. Get weather impact (if coordinates available)
        let weatherBoost = 0;
        let weatherData = null;
        let weatherExplanation = "No weather data";

        if (complaint.location?.coordinates) {
            try {
                const { getWeatherPriorityBoost } = await import(
                    "./weatherService.js"
                );
                const weatherResult = await getWeatherPriorityBoost(
                    complaint.location.coordinates,
                    complaint.category || "general"
                );
                weatherBoost = weatherResult.boost;
                weatherData = weatherResult.weatherData;
                weatherExplanation = weatherResult.explanation;
                logger.info(
                    `Weather boost: ${weatherBoost} - ${weatherExplanation}`
                );
            } catch (error) {
                logger.warn("Weather service unavailable:", error.message);
            }
        }

        // 4. Combine all factors with weighted scoring
        // ML: 40%, Rules: 40%, Weather: 20%
        const ML_WEIGHT = 0.4;
        const RULE_WEIGHT = 0.4;
        const WEATHER_WEIGHT = 0.2;

        const combinedScore = Math.min(
            100,
            mlScore * ML_WEIGHT +
                ruleBasedScore * RULE_WEIGHT +
                weatherBoost * WEATHER_WEIGHT
        );

        // 5. Determine final priority based on combined score
        let priority = "low";
        if (combinedScore >= 70) {
            priority = "high";
        } else if (combinedScore >= 40) {
            priority = "medium";
        }

        // 6. Calculate SLA hours based on priority and category
        const slaHours = calculateSLAHours(
            combinedScore,
            complaint.category || "general"
        );

        logger.info(
            `Final Priority: ${priority} (score: ${Math.round(
                combinedScore
            )}), SLA: ${slaHours} hours`
        );

        return {
            priority,
            slaHours,
            meta: {
                priorityScore: Math.round(combinedScore),
                factors: {
                    mlScore: Math.round(mlScore),
                    mlPriority: mlResult.priority,
                    mlExplanation: mlResult.explanation,
                    ruleBasedScore: Math.round(ruleBasedScore),
                    textScore: Math.round(textScore),
                    timeScore: Math.round(timeScore),
                    weatherBoost: Math.round(weatherBoost),
                    weatherExplanation,
                },
                weatherConditions: weatherData,
                explanation: `Priority ${priority} (${Math.round(
                    combinedScore
                )}/100): ML predicted ${mlResult.priority} (${Math.round(
                    mlScore
                )}), rule-based score ${Math.round(
                    ruleBasedScore
                )}, weather boost ${Math.round(
                    weatherBoost
                )}. ${weatherExplanation}`,
            },
        };
    } catch (error) {
        logger.error("Error analyzing priority:", error);
        // Fallback to simple priority
        return {
            priority: "medium",
            slaHours: 24,
            meta: {
                priorityScore: 50,
                factors: {
                    error: error.message,
                },
            },
        };
    }
};
