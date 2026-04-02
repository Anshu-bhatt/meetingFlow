import express from "express";
import { processMeeting } from "../controllers/meetingController.js";

const router = express.Router();

router.post("/process-meeting", processMeeting);

export default router;