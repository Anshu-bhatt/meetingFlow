import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./src/routes/ai.js";
import authRoutes from "./src/routes/auth.js";
import meetingRoute from "./src/routes/meetingRoute.js";
import transcribeRoute from "./src/routes/transcribe.js";

dotenv.config();
dotenv.config({ path: "../.env" });

const app = express();

app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:3000",
		credentials: true,
	})
);
app.use(express.json());

app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", meetingRoute);
app.use("/api/transcribe", transcribeRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
