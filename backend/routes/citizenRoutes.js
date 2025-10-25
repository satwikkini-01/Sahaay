import express from "express";
import { registerCitizen, getCitizens } from "../controllers/citizenController.js";
const router = express.Router();

router.post("/", registerCitizen);
router.get("/", getCitizens);

export default router;
