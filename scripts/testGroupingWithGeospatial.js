const mongoose = require("mongoose");

const MONGO_URI = "mongodb://127.0.0.1:27017/sahaay";

const complaintSchema = new mongoose.Schema({
	title: String,
	description: String,
	category: String,
	subcategory: String,
	location: {
		type: { type: String },
		coordinates: [Number],
		address: String,
		zipcode: String,
		city: String,
	},
	createdAt: { type: Date, default: Date.now },
});

// Important: Add 2dsphere index for geospatial queries
complaintSchema.index({ "location.coordinates": "2dsphere" });
const TestComplaint = mongoose.model("TestComplaint", complaintSchema);

// Helper to convert km to meters for MongoDB
const kmToMeters = (km) => km * 1000;

async function findNearbyComplaints(complaint, radiusKm = 5) {
	console.log(
		`Finding complaints within ${radiusKm}km of:`,
		complaint.location.coordinates
	);

	const nearbyComplaints = await TestComplaint.find({
		"location.coordinates": {
			$near: {
				$geometry: {
					type: "Point",
					coordinates: complaint.location.coordinates,
				},
				$maxDistance: kmToMeters(radiusKm),
			},
		},
		_id: { $ne: complaint._id },
	});

	console.log(`Found ${nearbyComplaints.length} nearby complaints`);
	return nearbyComplaints;
}

async function groupComplaints(complaints) {
	const locationClusters = [];
	const processed = new Set();

	for (let i = 0; i < complaints.length; i++) {
		const c1 = complaints[i];
		if (processed.has(c1._id.toString())) continue;

		const cluster = [c1];
		processed.add(c1._id.toString());

		for (let j = i + 1; j < complaints.length; j++) {
			const c2 = complaints[j];
			if (processed.has(c2._id.toString())) continue;

			// First check category + subcategory match
			const cat1 = c1.category || "uncategorized";
			const sub1 = c1.subcategory || "";
			const cat2 = c2.category || "uncategorized";
			const sub2 = c2.subcategory || "";

			if (cat1 !== cat2 || sub1 !== sub2) {
				console.log(
					`Category/subcategory mismatch: ${cat1}/${sub1} vs ${cat2}/${sub2}`
				);
				continue;
			}

			// Find nearby using MongoDB's $near
			const nearby = await TestComplaint.find({
				"location.coordinates": {
					$near: {
						$geometry: {
							type: "Point",
							coordinates: c1.location.coordinates,
						},
						$maxDistance: kmToMeters(5), // 5km radius
					},
				},
				_id: c2._id, // Only check this specific complaint
			});

			if (nearby.length > 0) {
				cluster.push(c2);
				processed.add(c2._id.toString());
				console.log(
					"Added to cluster due to proximity + matching category/subcategory"
				);
			}
		}

		if (cluster.length > 1) {
			locationClusters.push(cluster);
		}
	}

	return locationClusters;
}

async function run() {
	try {
		await mongoose.connect(MONGO_URI);
		console.log("Connected to MongoDB");

		// Clear test complaints
		await TestComplaint.deleteMany({});

		// Create test complaints
		const complaints = [
			{
				title: "Hard water issue",
				description: "Water is too hard",
				category: "water",
				subcategory: "quality",
				location: {
					type: "Point",
					coordinates: [76.6394, 12.2958], // Mysore coordinates
				},
			},
			{
				title: "Hard water problem",
				description: "Hard water in taps",
				category: "water",
				subcategory: "quality",
				location: {
					type: "Point",
					coordinates: [76.6395, 12.2959], // Very close to first complaint
				},
			},
			{
				title: "Low water pressure",
				description: "Very low pressure",
				category: "water",
				subcategory: "pressure",
				location: {
					type: "Point",
					coordinates: [76.6394, 12.2958], // Same location as first
				},
			},
		];

		// Save complaints
		for (const c of complaints) {
			await new TestComplaint(c).save();
		}
		console.log("Created test complaints");

		// Test nearby finding
		const allComplaints = await TestComplaint.find();
		console.log(
			"\nTesting with complaints:",
			allComplaints.map((c) => ({
				id: c._id,
				category: c.category,
				subcategory: c.subcategory,
				coords: c.location.coordinates,
			}))
		);

		// Test finding nearby for first complaint
		console.log("\nTesting nearby finding:");
		const nearby = await findNearbyComplaints(allComplaints[0]);
		console.log(
			"Nearby complaints:",
			nearby.map((c) => ({
				id: c._id,
				category: c.category,
				subcategory: c.subcategory,
				coords: c.location.coordinates,
			}))
		);

		// Test grouping
		console.log("\nTesting grouping:");
		const groups = await groupComplaints(allComplaints);
		console.log(
			"Groups found:",
			groups.map((g) => ({
				size: g.length,
				complaints: g.map((c) => ({
					id: c._id,
					category: c.category,
					subcategory: c.subcategory,
					coords: c.location.coordinates,
				})),
			}))
		);

		// Cleanup
		await TestComplaint.deleteMany({});
		await mongoose.disconnect();
	} catch (error) {
		console.error("Test failed:", error);
		console.error(error.stack);
	}
}

run();
