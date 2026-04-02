import { generateTasks } from "../services/ai/taskchain.js";
import { sendToSlack } from "../services/slack/slackService.js";

export const processMeeting = async (req, res) => {
  try {
    const { transcript } = req.body;

    const tasks = await generateTasks(transcript);

    await sendToSlack(tasks);

    res.json({ success: true, tasks });

  } catch (error) {
    res.status(500).json({ error: "Processing failed" });
  }
};