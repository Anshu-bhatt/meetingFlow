import axios from "axios";

const isConfiguredWebhook = (value) => {
  const candidate = String(value || "").trim();
  return Boolean(candidate) && /^https?:\/\//i.test(candidate) && !candidate.includes("your_slack_webhook_url");
};

const resolveWebhookUrl = (options = {}) => {
  const candidates = [options.webhookUrl, process.env.SLACK_WEBHOOK_URL]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return candidates.find(isConfiguredWebhook) || null;
};

const chunkTasksForSlack = (tasks) => {
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const task of tasks) {
    const line = `*${task.index}. ${task.title || "Untitled task"}*\nAssignee: ${task.assignee || "Unassigned"} | Deadline: ${task.deadline || "No deadline"} | Priority: ${task.priority || "Medium"}`;
    const projected = currentLength + (currentChunk.length ? 2 : 0) + line.length;

    if (projected > 3400 && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [line];
      currentLength = line.length;
      continue;
    }

    currentChunk.push(line);
    currentLength = projected;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
};

export const sendToSlack = async (payload, options = {}) => {
  const configuredWebhook = resolveWebhookUrl(options);
  if (!configuredWebhook) {
    return { sent: false, reason: "Slack webhook is not configured" };
  }

  const tasks = Array.isArray(payload) ? payload : payload?.tasks || [];
  const meetingSummary = Array.isArray(payload) ? "" : payload?.meetingSummary || "";
  const meetingTitle = Array.isArray(payload) ? "" : payload?.meetingTitle || "Meeting";

  if (!tasks.length) {
    await axios.post(configuredWebhook, {
      text: `Meeting tasks extracted\nMeeting: ${meetingTitle}\n\n${meetingSummary ? `Summary\n${meetingSummary}\n\n` : ""}No actionable tasks found.`,
    });
    return { sent: true, parts: 1 };
  }

  const normalizedTasks = tasks.map((task, index) => ({
    index: index + 1,
    title: task.task || task.title,
    assignee: task.assignee || task.assignee_name,
    deadline: task.deadline,
    priority: task.priority,
  }));

  const chunks = chunkTasksForSlack(normalizedTasks);

  for (let i = 0; i < chunks.length; i += 1) {
    const chunkHeader = `Meeting tasks extracted\nMeeting: ${meetingTitle}`;
    const summarySection = meetingSummary && i === 0 ? `\n\nSummary\n${meetingSummary}` : "";
    const partLabel = chunks.length > 1 ? `\n\nTasks (part ${i + 1}/${chunks.length})` : "";
    const body = chunks[i].join("\n\n");

    // eslint-disable-next-line no-await-in-loop
    await axios.post(configuredWebhook, {
      text: `${chunkHeader}${summarySection}${partLabel}\n\n${body}`,
    });
  }

  return { sent: true, parts: chunks.length };
};