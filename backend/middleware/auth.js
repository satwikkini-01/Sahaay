import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

export const auth = (req, res, next) => {
	try {
		// Get token from cookie OR Authorization header (Bearer)
		let token = null;

		if (req.cookies && req.cookies.token) token = req.cookies.token;
		if (!token && req.headers && req.headers.authorization) {
			const authHeader = req.headers.authorization;
			if (authHeader.startsWith("Bearer ")) {
				token = authHeader.split(" ")[1];
			}
		}

		if (!token) {
			logger.warn("No authentication token provided on request", {
				path: req.path,
				method: req.method,
			});
			return res
				.status(401)
				.json({ message: "No authentication token, access denied" });
		}

		// Verify token
		// Use same fallback secret as token creation to avoid mismatch when env var is absent
		const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
		// Debug info: avoid logging full token in production; log presence and small snippet
		logger.debug("Verifying auth token", {
			tokenPresent: !!token,
			tokenSnippet: token ? `${token.slice(0, 10)}...` : null,
			jwtSecretPresent: !!jwtSecret,
		});
		const verified = jwt.verify(token, jwtSecret);

		if (!verified) {
			return res
				.status(401)
				.json({ message: "Token verification failed, access denied" });
		}

		// Attach the decoded token payload to req.user so callers can access id, role, etc.
		req.user = verified; // e.g. { id, iat, exp }
		next();
	} catch (err) {
		// Handle common JWT errors explicitly so the client gets a 401
		if (
			err &&
			(err.name === "TokenExpiredError" || err.name === "JsonWebTokenError")
		) {
			logger.warn("Authentication token error:", err.message, {
				path: req.path,
				method: req.method,
				errorName: err.name,
			});
			return res.status(401).json({ message: err.message });
		}

		logger.error("Auth middleware error:", err);
		res.status(500).json({ error: err.message });
	}
};

// Check if user is a department official
export const isDepartmentOfficial = (req, res, next) => {
	try {
		if (!req.user || !req.user.role || req.user.role !== "department") {
			return res
				.status(403)
				.json({ message: "Access denied. Department officials only." });
		}
		next();
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Check if user is an admin
export const isAdmin = (req, res, next) => {
	try {
		if (!req.user || !req.user.role || req.user.role !== "admin") {
			return res
				.status(403)
				.json({ message: "Access denied. Administrators only." });
		}
		next();
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
