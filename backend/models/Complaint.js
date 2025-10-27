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
				default: "Point",
			},
			coordinates: {
				type: [Number],
				index: "2dsphere",
			},
			address: String,
			landmark: String,
			zipcode: String,
		},
		slaHours: { type: Number, default: 48 },
		slaDeadline: { type: Date },
		escalationLevel: { type: Number, default: 0 },
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
