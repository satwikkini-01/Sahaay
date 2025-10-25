import mongoose from "mongoose";

const citizenSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  address: String,
});

export default mongoose.model("Citizen", citizenSchema);
