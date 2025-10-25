import express from "express";
import dotenv from "dotenv";
import { connectMongo } from "./config/mongo.js";
import { connectPostgres } from "./config/postgres.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import citizenRoutes from "./routes/citizenRoutes.js";

dotenv.config();
const app = express();
app.use(express.json());

await connectMongo();
await connectPostgres();

app.use("/api/complaints", complaintRoutes);
if (departmentRoutes) app.use("/api/departments", departmentRoutes);
if (citizenRoutes) app.use("/api/citizens", citizenRoutes);

app.get("/", (req, res) => res.send("SAHAAY backend running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
