import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./src/routes/ai.js";
import authRoutes from "./src/routes/auth.js";
import meetingRoute from "./src/routes/meetingRoute.js";
import { ensureSeedAuthUsers } from "./src/services/db.js";

dotenv.config();
dotenv.config({ path: "../.env" });

const app = express();

const defaultOrigins = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"];
const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);
const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || (process.env.NODE_ENV !== "production" && isLocalDevOrigin(origin))) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", meetingRoute);

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