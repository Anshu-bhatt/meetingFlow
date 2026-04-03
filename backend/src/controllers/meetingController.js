import { generateTasks } from "../services/ai/taskchain.js";
import { sendToSlack } from "../services/slack/slackService.js";

export const processMeeting = async (req, res) => {
  try {
    const { transcript } = req.body;

    const result = await generateTasks(transcript);

    await sendToSlack(result);

    res.json({
      success: true,
      tasks: result.tasks || [],
      meetingSummary: result.meetingSummary || "",
      totalTasks: result.totalTasks ?? (result.tasks || []).length,
      highPriorityCount: result.highPriorityCount ?? (result.tasks || []).filter((task) => task.priority === "High").length,
      speakers_detected: result.speakers_detected || [],
    });

  } catch (error) {
    res.status(500).json({ error: "Processing failed" });
  }
};