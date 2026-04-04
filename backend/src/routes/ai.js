import express from "express";
import { extractTasks } from "../controllers/aiController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/extract-tasks", requireAuth, extractTasks);

export default router;
