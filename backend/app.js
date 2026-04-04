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

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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