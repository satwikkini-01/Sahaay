import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
	{
		citizen: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Citizen",
			required: true,
		},
		department: {
			pgDeptId: Number,
			name: String,
		},
		title: { type: String, required: true },
		description: { type: String, required: true },
		category: { type: String, required: true },
		subcategory: { type: String },
		priority: {
			type: String,
			enum: ["low", "medium", "high"],
			default: "medium",
		},
		status: {
			type: String,
			enum: ["pending", "in-progress", "resolved", "escalated"],
			default: "pending",
		},
		location: {
			type: {
				type: String,
				enum: ["Point"],
				required: true,
			},
			coordinates: {
				type: [Number],
				index: "2dsphere",
				required: true,
			},
			address: { type: String, required: true },
			landmark: String,
			zipcode: { type: String, required: true },
			city: { type: String, required: true },
		},
		slaHours: { type: Number, default: 48 },
		slaDeadline: { type: Date },
		escalationLevel: { type: Number, default: 0 },
		// Grouping fields for similar complaints
		groupId: { type: String, index: true },
		groupSize: { type: Number, default: 1 },
		meta: {
			priorityScore: Number,
			priorityFactors: {
				textScore: Number,
				timeScore: Number,
				weatherScore: Number,
			},
			slaBreached: { type: Boolean, default: false },
			slaBreachedAt: Date,
			weatherConditions: {
				temperature: Number,
				weather: String,
				timestamp: Date,
			},
		},
	},
	{ timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);
