import { connectMongo } from "../backend/config/mongo.js";
import mongoose from "mongoose";
import Citizen from "../backend/models/Citizen.js";
import Complaint from "../backend/models/Complaint.js";
import {
	findSimilarComplaints,
	groupSimilarComplaints,
} from "../backend/utils/complaintClustering.js";

const run = async () => {
	try {
		await connectMongo();

		// Create a test citizen
		const citizen = new Citizen({
			name: "GroupTest User",
			email: `grouptest+${Date.now()}@example.com`,
			phone: "9000000000",
			password: "irrelevant",
			address: "Test address",
			city: "TestCity",
		});
		await citizen.save();

		const coords = [76.6394, 12.2958]; // [lon, lat]

		// Create two complaints at same location and same category
		const c1 = new Complaint({
			citizen: citizen._id,
			department: { pgDeptId: 0, name: "TestDept" },
			title: "Hard water 1",
			description: "The water is very hard in this area and affects appliances",
			category: "water",
			subcategory: "Water Quality",
			location: {
				type: "Point",
				coordinates: coords,
				address: "Vijaynagar II Stage, Mysore, Karnataka",
				zipcode: "570017",
				city: "Mysore",
			},
		});

		const c2 = new Complaint({
			citizen: citizen._id,
			department: { pgDeptId: 0, name: "TestDept" },
			title: "Hard water 2",
			description: "Hard water causing issues with washing machines",
			category: "water",
			subcategory: "Water Quality",
			location: {
				type: "Point",
				coordinates: coords,
				address: "Vijaynagar II Stage, Mysore, Karnataka",
				zipcode: "570017",
				city: "Mysore",
			},
		});

		await c1.save();
		await c2.save();

		console.log("Saved test complaints:", c1._id.toString(), c2._id.toString());

		// Run findSimilarComplaints for c1
		const group = await findSimilarComplaints(c1, 2); // 2 km radius
		console.log(
			"findSimilarComplaints result (2 km):",
			group ? { id: group.id, size: group.complaints.length } : null
		);

		const group5 = await findSimilarComplaints(c1, 5); // 5 km radius
		console.log(
			"findSimilarComplaints result (5 km):",
			group5 ? { id: group5.id, size: group5.complaints.length } : null
		);

		// Also run the groupSimilarComplaints directly on array
		const groups = await groupSimilarComplaints([c1, c2], 2);
		console.log(
			"groupSimilarComplaints direct result:",
			groups.map((g) => ({ id: g.id, size: g.complaints.length }))
		);

		// Cleanup
		await Complaint.deleteMany({ _id: { $in: [c1._id, c2._id] } });
		await Citizen.deleteOne({ _id: citizen._id });

		await mongoose.disconnect();
		console.log("Test completed and cleaned up");
	} catch (err) {
		console.error("Test failed:", err);
		process.exit(1);
	}
};

run();
