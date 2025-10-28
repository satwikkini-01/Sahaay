const mongoose = require("mongoose");

const MONGO_URI = "mongodb://127.0.0.1:27017/sahaay";

// Simplified Complaint schema for testing
const complaintSchema = new mongoose.Schema({
	title: String,
	description: String,
	category: String,
	location: {
		type: { type: String },
		coordinates: [Number],
		address: String,
		zipcode: String,
		city: String,
	},
});
complaintSchema.index({ "location.coordinates": "2dsphere" });
const TestComplaint = mongoose.model("TestComplaint", complaintSchema);

// Simplified grouping function
async function testGrouping(complaints) {
	// First group by location (2km radius)
	const locationGroups = [];
	const processed = new Set();

	for (const c1 of complaints) {
		if (processed.has(c1._id.toString())) continue;

		const group = [c1];
		processed.add(c1._id.toString());

		// Find nearby complaints with same category
		for (const c2 of complaints) {
			if (processed.has(c2._id.toString())) continue;
			if (c1.category !== c2.category) {
				console.log(`Category mismatch: ${c1.category} vs ${c2.category}`);
				continue;
			}

			// Calculate distance
			const [lon1, lat1] = c1.location.coordinates;
			const [lon2, lat2] = c2.location.coordinates;

			// Simple distance check (for testing)
			const dist = Math.sqrt(
				Math.pow(lon2 - lon1, 2) + Math.pow(lat2 - lat1, 2)
			);

			console.log(`Distance between complaints: ${dist}`);

			if (dist < 0.1) {
				// Very small for testing
				group.push(c2);
				processed.add(c2._id.toString());
				console.log("Added to group due to proximity + matching category");
			}
		}

		if (group.length > 1) {
			locationGroups.push(group);
		}
	}

	return locationGroups;
}

async function run() {
	try {
		await mongoose.connect(MONGO_URI);
		console.log("Connected to MongoDB");

		// Clear test complaints
		await TestComplaint.deleteMany({});

		// Create two very similar complaints
		const complaint1 = new TestComplaint({
			title: "Hard water issue",
			description: "Water is too hard",
			category: "water",
			location: {
				type: "Point",
				coordinates: [76.6394, 12.2958],
				address: "Test Address",
				zipcode: "570017",
				city: "Mysore",
			},
		});

		const complaint2 = new TestComplaint({
			title: "Hard water problem",
			description: "Hard water in taps",
			category: "water",
			location: {
				type: "Point",
				coordinates: [76.6394, 12.2958], // Exact same location
				address: "Test Address",
				zipcode: "570017",
				city: "Mysore",
			},
		});

		await complaint1.save();
		await complaint2.save();
		console.log("Created test complaints");

		// Test grouping
		const complaints = await TestComplaint.find();
		console.log(
			"\nTesting grouping with complaints:",
			complaints.map((c) => ({
				id: c._id,
				category: c.category,
				coords: c.location.coordinates,
			}))
		);

		const groups = await testGrouping(complaints);
		console.log(
			"\nGrouping results:",
			groups.map((g) => ({
				size: g.length,
				complaints: g.map((c) => c._id),
			}))
		);

		// Cleanup
		await TestComplaint.deleteMany({});
		await mongoose.disconnect();
	} catch (error) {
		console.error("Test failed:", error);
	}
}

run();
