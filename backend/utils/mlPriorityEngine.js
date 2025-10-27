import natural from "natural";

// Sample training data (expand with real complaints for better accuracy)
const trainingData = [
	{ text: "Water pipeline burst near hospital", label: "high" },
	{ text: "Major power outage in city center", label: "high" },
	{ text: "Street light not working", label: "low" },
	{ text: "Road pothole near school", label: "medium" },
	{ text: "Rail track damage at crossing", label: "high" },
	{ text: "Minor water leak in apartment", label: "medium" },
	{ text: "Electric meter issue", label: "medium" },
	{ text: "Garbage not collected", label: "low" },
	{ text: "Traffic signal malfunction", label: "high" },
	{ text: "Sewage overflow in market", label: "high" },
	{ text: "Low water pressure", label: "medium" },
	{ text: "Bus stop shelter broken", label: "low" },
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
