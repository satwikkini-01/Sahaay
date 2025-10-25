import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
	pgDeptId: { type: Number, required: true },
	name: { type: String, required: true },
	categoryHandled: [String],
});

export default mongoose.model("Department", departmentSchema);
