import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { extractTasks } from "./src/controllers/aiController.js";

dotenv.config();
dotenv.config({ path: "../.env" });

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

app.post("/api/ai/extract-tasks", extractTasks);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = 5001; // Different port to avoid conflicts

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
