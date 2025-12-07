import Citizen from "../models/Citizen.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

export const registerCitizen = async (req, res) => {
	try {
		logger.info("Received registration request:", {
			...req.body,
			password: "[REDACTED]",
		});

		const { name, email, phone, password, address, city } = req.body;

		// Validate required fields
		if (!name || !email || !phone || !password || !address || !city) {
			logger.warn("Missing required fields:", {
				name: !!name,
				email: !!email,
				phone: !!phone,
				password: !!password,
				address: !!address,
				city: !!city,
			});
			return res.status(400).json({
				error: "All fields are required",
				required: ["name", "email", "phone", "password", "address", "city"],
			});
		}

		// Check if email already exists
		const existingUser = await Citizen.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			logger.warn("Email already registered:", email);
			return res.status(400).json({ error: "Email already registered" });
		}

		// Hash password
		logger.info("Hashing password...");
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create new citizen
		const citizen = new Citizen({
			name,
			email: email.toLowerCase(),
			phone,
			password: hashedPassword,
			address,
			city,
		});

		logger.info("Saving citizen to database...");
		await citizen.save();

		// Remove password from response
		const citizenResponse = citizen.toObject();
		delete citizenResponse.password;

		logger.info("Citizen registered successfully:", citizenResponse);
		res.status(201).json({
			message: "Registration successful",
			citizen: citizenResponse,
		});
	} catch (err) {
		logger.error("Registration error:", {
			error: err.message,
			stack: err.stack,
		});
		res.status(400).json({ error: err.message });
	}
};
export const getCitizens = async (req, res) => {
	try {
		const citizens = await Citizen.find().select("-password");
		res.json(citizens);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

export const logoutCitizen = async (req, res) => {
	try {
		// Clear the auth cookie
		res.clearCookie("token", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
		});

		logger.info("Citizen logged out successfully");
		res.json({ message: "Logged out successfully" });
	} catch (err) {
		logger.error("Logout error:", err);
		res.status(500).json({ error: "Logout failed" });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const { name, phone, address, city } = req.body;
		logger.info(
			"Updating profile for citizen:",
			req.user && req.user.id ? req.user.id : req.user
		);

		// Find citizen by id from auth middleware (req.user is the decoded token payload)
		const citizenId = req.user && req.user.id ? req.user.id : req.user;
		const citizen = await Citizen.findById(citizenId);
		if (!citizen) {
			logger.warn("Citizen not found:", citizenId);
			return res.status(404).json({ error: "Citizen not found" });
		}

		// Update fields
		if (name) citizen.name = name;
		if (phone) citizen.phone = phone;
		if (address) citizen.address = address;
		if (city) citizen.city = city;

		await citizen.save();

		// Remove password from response
		const citizenResponse = citizen.toObject();
		delete citizenResponse.password;

		logger.info("Profile updated successfully:", citizenResponse);
		res.json({
			message: "Profile updated successfully",
			citizen: citizenResponse,
		});
	} catch (err) {
		logger.error("Profile update error:", err);
		res.status(400).json({ error: err.message });
	}
};

export const loginCitizen = async (req, res) => {
	try {
		logger.info("Login attempt for:", req.body.email);
		const { email, password } = req.body;

		// Validate input
		if (!email || !password) {
			return res.status(400).json({ error: "Email and password are required" });
		}

		// Find user by email
		const citizen = await Citizen.findOne({ email: email.toLowerCase() });
		if (!citizen) {
			logger.warn("Login failed: Email not found:", email);
			return res.status(401).json({ error: "Invalid credentials" });
		}

		// Verify password
		const isMatch = await bcrypt.compare(password, citizen.password);
		if (!isMatch) {
			logger.warn("Login failed: Invalid password for:", email);
			return res.status(401).json({ error: "Invalid credentials" });
		}

		// Create JWT token
		const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
		if (!process.env.JWT_SECRET) {
			logger.warn(
				"JWT_SECRET not set in environment; using fallback secret for token signing. Set JWT_SECRET in production."
			);
		}
		const token = jwt.sign({ id: citizen._id }, jwtSecret, { expiresIn: "1d" });

		// Remove password from response
		const citizenResponse = citizen.toObject();
		delete citizenResponse.password;

		logger.info("Login successful for:", email);

		// Set cookie
		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 24 * 60 * 60 * 1000, // 1 day
		});

		res.json({
			message: "Login successful",
			token,
			citizen: citizenResponse,
		});
	} catch (err) {
		logger.error("Login error:", err);
		res.status(500).json({ error: "Login failed" });
	}
};

export const googleLogin = async (req, res) => {
    try {
        const { email, name, googleId } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // Check if citizen exists
        let citizen = await Citizen.findOne({ email });

        if (!citizen) {
            // Create new citizen if not exists
            citizen = new Citizen({
                name: name || email.split("@")[0],
                email,
                password: googleId || Date.now().toString(), // Dummy password for google users
                phone: "0000000000", // Placeholder
            });
            await citizen.save();
        }

        // Generate JWT
        const token = jwt.sign({ id: citizen._id }, process.env.JWT_SECRET, {
            expiresIn: "30d",
        });

        res.json({
            token,
            citizen: {
                id: citizen._id,
                name: citizen.name,
                email: citizen.email,
            },
        });
    } catch (err) {
        logger.error("Google login error:", err);
        res.status(500).json({ error: "Google login failed" });
    }
};

export const getProfile = async (req, res) => {
    try {
        const citizen = await Citizen.findById(req.user.id).select("-password");
        res.json(citizen);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
