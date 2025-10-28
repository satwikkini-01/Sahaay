import express from "express";
import {
	registerCitizen,
	getCitizens,
	loginCitizen,
	logoutCitizen,
	updateProfile,
} from "../controllers/citizenController.js";
import { auth, isDepartmentOfficial, isAdmin } from "../middleware/auth.js";
import { validate, registerRules } from "../middleware/validation.js";
const router = express.Router();

router.post("/register", registerRules, validate, registerCitizen);
router.post("/login", loginCitizen);
router.post("/logout", logoutCitizen);
router.put("/profile", auth, updateProfile);
router.get("/", auth, isAdmin, getCitizens);

export default router;