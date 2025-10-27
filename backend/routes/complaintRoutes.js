import express from "express";
import {
	createComplaint,
	getComplaints,
	runSLA,
	getComplaintAnalytics,
	getUserComplaints,
} from "../controllers/complaintController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createComplaint);
router.get("/", getComplaints);
router.get("/my-complaints", auth, getUserComplaints);
router.post("/run-sla", runSLA);
router.get("/analytics", getComplaintAnalytics);

export default router;
