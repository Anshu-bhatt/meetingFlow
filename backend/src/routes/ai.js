import express from "express";
import { extractTasks } from "../controllers/aiController.js";

const router = express.Router();

router.post("/extract-tasks", extractTasks);

export default router;
