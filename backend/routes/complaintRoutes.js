import express from "express";
import {
	createComplaint,
	getComplaints,
	getUserComplaints,
	runSLA,
	getComplaintAnalytics,
	getComplaintGroups
} from "../controllers/complaintController.js";
import { auth } from "../middleware/auth.js";
import { validate, complaintRules } from "../middleware/validation.js";

const router = express.Router();

// Public routes
router.get("/analytics", getComplaintAnalytics);
router.get("/groups", getComplaintGroups);

// Protected routes
router.post("/", auth, complaintRules, validate, createComplaint);
router.get("/", auth, getComplaints);
router.get("/my-complaints", auth, getUserComplaints);
router.post("/run-sla", auth, runSLA);

export default router;