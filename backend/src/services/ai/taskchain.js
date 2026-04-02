import { getLlm } from "./llm.js";
import { taskPrompt } from "./prompt.js";

const normalizeTaskText = (value) =>
  String(value || "")
    .replace(/^[-*]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizePriority = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "high" || normalized === "low") {
    return normalized;
  }
  return "medium";
};

const normalizeAssignee = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizeDeadline = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
  if (isoDateOnly.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
};

const dedupeTasks = (tasks) => {
  const seen = new Set();
  const unique = [];

  for (const task of tasks) {
    const key = `${task.task.toLowerCase()}|${(task.assignee || "").toLowerCase()}|${task.deadline || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(task);
  }

  return unique;
};

const sanitizeTasks = (items) => {
  if (!Array.isArray(items)) return [];

  const sanitized = items
    .map((item) => {
      const task = normalizeTaskText(item?.task ?? item?.title);
      if (!task) return null;

      return {
        task,
        assignee: normalizeAssignee(item?.assignee),
        deadline: normalizeDeadline(item?.deadline),
        priority: normalizePriority(item?.priority),
      };
    })
    .filter(Boolean)
    .slice(0, 12);

  return dedupeTasks(sanitized);
};

const buildFallbackTasks = (transcript) => {
  if (typeof transcript !== "string" || !transcript.trim()) {
    return [];
  }

  const sentences = transcript
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const actionHints = /\b(need to|needs to|should|must|will|follow up|schedule|review|update|send|prepare|complete|deliver)\b/i;
  const assigneeHints = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:will|should|needs to|must)\b/;
  const deadlineHints = /\b(by\s+[^.,;]+|before\s+[^.,;]+|next\s+\w+|tomorrow|today|this\s+week|next\s+week)\b/i;

  return sentences
    .filter((line) => actionHints.test(line))
    .slice(0, 12)
    .map((line) => {
      const assigneeMatch = line.match(assigneeHints);
      const deadlineMatch = line.match(deadlineHints);
      const normalized = normalizeTaskText(line);

      return {
        task: normalized,
        assignee: assigneeMatch?.[1] ?? null,
        deadline: deadlineMatch?.[1] ?? null,
        priority: /\b(asap|urgent|critical|high priority)\b/i.test(line)
          ? "high"
          : /\b(whenever|low priority|nice to have)\b/i.test(line)
          ? "low"
          : "medium",
      };
    });
};

const extractJsonPayload = (rawContent) => {
  const trimmed = rawContent.trim();
  const withoutCodeFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  if (withoutCodeFence.startsWith("[")) {
    return withoutCodeFence;
  }

  const tasksObjectMatch = withoutCodeFence.match(/\{[\s\S]*"tasks"\s*:\s*\[[\s\S]*\][\s\S]*\}/i);
  if (tasksObjectMatch) {
    try {
      const parsed = JSON.parse(tasksObjectMatch[0]);
      return JSON.stringify(parsed.tasks || []);
    } catch {
      // fall through to generic array extraction
    }
  }

  return withoutCodeFence.match(/\[[\s\S]*\]/)?.[0] || "[]";
};

export const generateTasks = async (transcript) => {
  try {
    const formattedPrompt = await taskPrompt.format({
      transcript,
    });

    const response = await getLlm().invoke(formattedPrompt);

    const rawContent = Array.isArray(response.content)
      ? response.content
          .map((part) => (typeof part?.text === "string" ? part.text : ""))
          .join("\n")
      : String(response.content || "");

    const jsonBlock = extractJsonPayload(rawContent);

    const parsed = JSON.parse(jsonBlock);
    return sanitizeTasks(Array.isArray(parsed) ? parsed : []);

  } catch (error) {
    console.error("TaskChain Error:", error);
    // Keep extraction functional even when AI provider credentials/config are missing.
    return sanitizeTasks(buildFallbackTasks(transcript));
  }
};