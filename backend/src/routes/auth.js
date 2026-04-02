import express from "express";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  res.json({ userId: req.auth.userId });
});

export default router;