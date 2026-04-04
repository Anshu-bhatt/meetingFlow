import { generateTasks } from "../services/ai/taskchain.js";
import { sendToSlack } from "../services/slack/slackService.js";

export const processMeeting = async (req, res) => {
  try {
    const { transcript } = req.body;
    let slackUpdated = false;

    const result = await generateTasks(transcript);

    const slackResult = await sendToSlack(result);
    if (slackResult?.sent) {
      slackUpdated = true;
    }

    res.json({
      success: true,
      tasks: result.tasks || [],
      meetingSummary: result.meetingSummary || "",
      totalTasks: result.totalTasks ?? (result.tasks || []).length,
      highPriorityCount: result.highPriorityCount ?? (result.tasks || []).filter((task) => task.priority === "High").length,
      speakers_detected: result.speakers_detected || [],
      slack_updated: slackUpdated,
    });

  } catch (error) {
    res.status(500).json({ error: "Processing failed" });
  }
};