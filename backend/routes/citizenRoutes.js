import express from "express";
import {
	registerCitizen,
	getCitizens,
	loginCitizen,
	logoutCitizen,
	updateProfile,
} from "../controllers/citizenController.js";
import { auth } from "../middleware/auth.js";
const router = express.Router();

router.post("/register", registerCitizen);
router.post("/login", loginCitizen);
router.post("/logout", logoutCitizen);
router.put("/profile", auth, updateProfile);
router.get("/", getCitizens);

export default router;
