import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";

// Rate limiting
export const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
});

// Validation middleware
export const validate = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	next();
};

// Validation rules
export const registerRules = [
	body("name")
		.trim()
		.isLength({ min: 2, max: 50 })
		.withMessage("Name must be between 2 and 50 characters"),
	body("email").trim().isEmail().withMessage("Please enter a valid email"),
	body("password")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters")
		.matches(/\d/)
		.withMessage("Password must contain a number")
		.matches(/[a-z]/)
		.withMessage("Password must contain a lowercase letter")
		.matches(/[A-Z]/)
		.withMessage("Password must contain an uppercase letter")
		.matches(/[^\w]/)
		.withMessage("Password must contain a special character"),
	body("phone")
		.matches(/^[0-9]{10}$/)
		.withMessage("Phone number must be 10 digits"),
	body("address")
		.trim()
		.isLength({ min: 10, max: 200 })
		.withMessage("Address must be between 10 and 200 characters"),
];

export const complaintRules = [
	body("title")
		.trim()
		.isLength({ min: 5, max: 100 })
		.withMessage("Title must be between 5 and 100 characters"),
	body("description")
		.trim()
		.isLength({ min: 20, max: 1000 })
		.withMessage("Description must be between 20 and 1000 characters"),
	body("category").trim().notEmpty().withMessage("Category is required"),
	body("location")
		.trim()
		.isLength({ min: 5, max: 200 })
		.withMessage("Location must be between 5 and 200 characters"),
];
