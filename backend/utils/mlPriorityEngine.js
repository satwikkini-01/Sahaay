import natural from "natural";
import logger from "./logger.js";

// Comprehensive training data for accurate priority prediction
const trainingData = [
    // HIGH PRIORITY - Critical safety and infrastructure issues
    // Water emergencies
    {
        text: "water pipeline burst near hospital emergency affecting patients",
        label: "high",
    },
    {
        text: "major water contamination health hazard sewage mixing drinking water",
        label: "high",
    },
    {
        text: "no water supply entire area thousands affected critical",
        label: "high",
    },
    {
        text: "sewage overflow market area health hazard contamination",
        label: "high",
    },
    {
        text: "water main break flooding streets damaging property",
        label: "high",
    },

    // Electricity emergencies
    {
        text: "major power outage city center thousands businesses affected",
        label: "high",
    },
    {
        text: "transformer failure fire station no backup power emergency",
        label: "high",
    },
    {
        text: "live wire exposed danger electric shock risk pedestrians",
        label: "high",
    },
    {
        text: "road collapse bridge damage major accident risk traffic",
        label: "high",
    },
    {
        text: "traffic signal failure busy intersection accidents happening",
        label: "high",
    },
    {
        text: "rail track damage signal failure train safety risk",
        label: "high",
    },

    // MEDIUM PRIORITY - Significant issues affecting daily life
    {
        text: "water pressure low irregular supply affecting residents",
        label: "medium",
    },
    {
        text: "pipeline leak causing water wastage needs repair",
        label: "medium",
    },
    { text: "drainage block causing water logging in street", label: "medium" },
    {
        text: "frequent power cuts affecting neighborhood daily",
        label: "medium",
    },
    {
        text: "street lights not working safety concern at night",
        label: "medium",
    },
    { text: "electric meter malfunction billing issues", label: "medium" },
    {
        text: "large pothole on main road causing vehicle damage",
        label: "medium",
    },
    { text: "road damage uneven surface traffic slow", label: "medium" },
    { text: "signal malfunction causing traffic delays", label: "medium" },
    {
        text: "platform damage at station passenger inconvenience",
        label: "medium",
    },
    { text: "ticket system not working long queues", label: "medium" },

    // LOW PRIORITY - Minor issues and maintenance
    { text: "small water leak in pipe minor issue", label: "low" },
    { text: "water meter reading issue billing query", label: "low" },
    { text: "connection request new water line", label: "low" },
    { text: "street light bulb replacement needed", label: "low" },
    { text: "meter installation request new connection", label: "low" },
    { text: "billing query electricity charges", label: "low" },
    { text: "small pothole road marking faded", label: "low" },
    { text: "sign board damaged needs replacement", label: "low" },
    { text: "bus stop shelter minor repair needed", label: "low" },
    { text: "station cleaning required amenity issue", label: "low" },
    { text: "parking area maintenance general repair", label: "low" },
];

// Create and train classifier
const classifier = new natural.BayesClassifier();
trainingData.forEach((item) => {
    classifier.addDocument(item.text.toLowerCase(), item.label);
});
classifier.train();

// Predict priority and explain
export function mlPredictPriority({ title, description, category }) {
    const text = `${title} ${description} ${category}`.toLowerCase();
    const label = classifier.classify(text);
    const explanations = classifier
        .getClassifications(text)
        .sort((a, b) => b.value - a.value)
        .map((c) => ({ priority: c.label, score: c.value }));

    return {
        priority: label,
        explanation: explanations,
    };
}

// For retraining with more data, export classifier
export { classifier };
