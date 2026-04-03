import axios from "axios";

export const sendToSlack = async (payload) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const tasks = Array.isArray(payload) ? payload : payload?.tasks || [];
  const meetingSummary = Array.isArray(payload) ? "" : payload?.meetingSummary || "";

  const message = tasks.length
    ? tasks.map(
        (t, i) =>
          `*${i + 1}. ${t.task || t.title || "Untitled task"}*\n👤 ${t.assignee || "Unassigned"} | ⏰ ${t.deadline || "No deadline"} | 🔥 ${t.priority}`
      ).join("\n\n")
    : "No actionable tasks found.";

  await axios.post(webhookUrl, {
    text: `📋 *Meeting Tasks Extracted*\n\n${meetingSummary ? `*Summary*\n${meetingSummary}\n\n` : ""}${message}`,
  });
};