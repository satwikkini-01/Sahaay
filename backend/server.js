import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectMongo } from "./config/mongo.js";
import { connectPostgres } from "./config/postgres.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import citizenRoutes from "./routes/citizenRoutes.js";
import { startSLAWatcher } from "./utils/slaScheduler.js";
import { configureMiddleware } from "./middleware/index.js";
import logger from "./utils/logger.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Configure CORS
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:3000",
		credentials: true,
	})
);

// Configure middleware
configureMiddleware(app);

// Connect to databases
try {
	await connectMongo();
	logger.info("MongoDB Connected");
	await connectPostgres();
	logger.info("PostgreSQL Connected");
	startSLAWatcher();
	logger.info("SLA Watcher Started");
} catch (error) {
	logger.error("Database connection error:", error);
	process.exit(1);
}

// API Routes
app.use("/api/complaints", complaintRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/citizens", citizenRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// Root endpoint
app.get("/", (req, res) => {
	res.json({
		name: "SAHAAY API",
		version: "1.0.0",
		documentation: "/api-docs",
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		error: "Not Found",
		message: "The requested resource does not exist",
	});
});

// Global error handler
app.use((err, req, res, next) => {
	logger.error(err);
	res.status(err.status || 500).json({
		error: err.name || "Internal Server Error",
		message: err.message || "Something went wrong",
	});
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	logger.info(`Server running on port ${PORT}`);
	logger.info(
		`API Documentation available at http://localhost:${PORT}/api-docs`
	);
});
