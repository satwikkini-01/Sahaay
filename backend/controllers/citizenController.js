import Citizen from "../models/Citizen.js";

export const registerCitizen = async (req, res) => {
	try {
		const { name, email } = req.body;
		if (!name || !email)
			return res.status(400).json({ error: "name and email are required" });
		const citizen = new Citizen({ ...req.body, email: email.toLowerCase() });
		await citizen.save();
		res
			.status(201)
			.json({ message: "Citizen registered successfully", citizen });
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
};
export const getCitizens = async (req, res) => {
	try {
		const citizens = await Citizen.find();
		res.json(citizens);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
