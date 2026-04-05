import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./src/routes/ai.js";
import authRoutes from "./src/routes/auth.js";
import googleAuthRoutes from "./src/routes/googleAuth.js";
import dbRoutes from "./src/routes/db.js";
import meetingRoute from "./src/routes/meetingRoute.js";
import transcribeRoute from "./src/routes/transcribe.js";
import { ensureSeedAuthUsers } from "./src/services/db.js";

dotenv.config();
dotenv.config({ path: "../.env" });

const app = express();

const defaultOrigins = [
	"http://localhost:3000",
	"http://localhost:3001",
	"http://127.0.0.1:3000",
	"http://127.0.0.1:3001",
	"https://meeting-flow-frontend-git-main-anshu-bhatts-projects.vercel.app",
];
const configuredOrigins = (process.env.FRONTEND_URL || "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);
const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);
const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.has(origin) || (process.env.NODE_ENV !== "production" && isLocalDevOrigin(origin))) {
				return callback(null, true);
			}

			return callback(new Error(`CORS blocked for origin: ${origin}`));
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
	})
);
app.use(express.json());

app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api", dbRoutes);
app.use("/api", meetingRoute);
app.use("/api/transcribe", transcribeRoute);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
	try {
		await ensureSeedAuthUsers();
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to seed auth users:", error.message);
		process.exit(1);
	}
};

startServer();
