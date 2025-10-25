import express from "express";
import {
  createComplaint,
  getComplaints,
  runSLA,
} from "../controllers/complaintController.js";

const router = express.Router();

router.post("/", createComplaint);
router.get("/", getComplaints);
router.post("/run-sla", runSLA);

export default router;
