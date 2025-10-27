import mongoose from "mongoose";

const citizenSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		phone: { type: String, required: true },
		password: { type: String, required: true },
		address: { type: String, required: true },
		city: { type: String, required: true },
		createdAt: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

export default mongoose.model("Citizen", citizenSchema);
