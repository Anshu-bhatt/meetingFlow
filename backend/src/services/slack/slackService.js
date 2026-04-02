import axios from "axios";

export const sendToSlack = async (tasks) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  const message = tasks.length
    ? tasks.map(
        (t, i) =>
          `*${i + 1}. ${t.task}*\n👤 ${t.assignee || "Unassigned"} | ⏰ ${t.deadline || "No deadline"} | 🔥 ${t.priority}`
      ).join("\n\n")
    : "No actionable tasks found.";

  await axios.post(webhookUrl, {
    text: `📋 *Meeting Tasks Extracted*\n\n${message}`,
  });
};