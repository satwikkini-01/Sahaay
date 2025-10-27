import express from "express";
import swaggerUi from "swagger-ui-express";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { limiter } from "./validation.js";
import logger from "../utils/logger.js";

// Swagger documentation
const swaggerDocument = {
	openapi: "3.0.0",
	info: {
		title: "Sahaay API Documentation",
		version: "1.0.0",
		description: "API documentation for Sahaay - A Complaint Management System",
	},
	servers: [
		{
			url: "http://localhost:5000",
			description: "Development server",
		},
	],
	// Add your API endpoints documentation here
};

export const configureMiddleware = (app) => {
	// Security middleware
	app.use(helmet());
	app.use(limiter);

	// Parse cookies
	app.use(cookieParser());

	// Parse JSON bodies
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	// Compress all responses
	app.use(compression());

	// API documentation
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

	// Error handling middleware
	app.use((err, req, res, next) => {
		logger.error("Unhandled middleware error:", err.stack || err);
		res.status(500).json({ message: "Something went wrong!" });
	});

	return app;
};
