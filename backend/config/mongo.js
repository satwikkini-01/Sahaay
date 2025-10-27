import mongoose from "mongoose";
import logger from "../utils/logger.js";

export const connectMongo = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		logger.info("MongoDB connected");
	} catch (error) {
		logger.error("MongoDB connection error:", error.message);
		process.exit(1);
	}
};
