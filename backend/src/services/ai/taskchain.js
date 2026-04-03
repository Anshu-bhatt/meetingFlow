import { getAvailableLlms } from "./llm.js";
import { cleanerPrompt, extractorPrompt, validatorPrompt } from "./prompt.js";

const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const toText = (value) => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
  }

  if (value && typeof value.content === "string") {
    return value.content;
  }

  return String(value ?? "");
};

const extractJsonPayload = (rawContent) => {
  const content = toText(rawContent).trim();
  const withoutFence = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  if (withoutFence.startsWith("{") || withoutFence.startsWith("[")) {
    return withoutFence;
  }

  const objectMatch = withoutFence.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  const arrayMatch = withoutFence.match(/\[[\s\S]*\]/);
  return arrayMatch ? arrayMatch[0] : "{}";
};

const parseJsonContent = (rawContent, fallbackValue) => {
  try {
    return JSON.parse(extractJsonPayload(rawContent));
  } catch {
    return fallbackValue;
  }
};

const normalizePriority = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "high") return "High";
  if (normalized === "low") return "Low";
  return "Medium";
};

const normalizeDeadline = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "not set" || trimmed === "none") {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
};

const normalizeTask = (task, index) => {
  const rawTitle =
    typeof task === "string"
      ? task
      : task?.task ?? task?.title ?? task?.name ?? "";
  const title = normalizeText(rawTitle);

  if (!title) {
    return null;
  }

  return {
    id: `extracted-${Date.now()}-${index}`,
    title,
    assignee: normalizeText(task?.assignee) || "Unassigned",
    priority: normalizePriority(task?.priority),
    deadline: normalizeDeadline(task?.deadline),
    completed: false,
    context: normalizeText(task?.context),
    dependencies: normalizeText(task?.dependencies),
    status: normalizeText(task?.status) || "pending",
  };
};

const dedupeTasks = (tasks) => {
  const seen = new Set();
  const uniqueTasks = [];

  for (const task of tasks) {
    const key = `${normalizeText(task?.title).toLowerCase()}|${normalizeText(task?.assignee).toLowerCase()}|${normalizeText(task?.deadline)}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueTasks.push(task);
  }

  return uniqueTasks;
};

const buildFallbackResult = (transcript, reason = "") => {
  if (typeof transcript !== "string" || !transcript.trim()) {
    return {
      meetingSummary: "No transcript was provided.",
      tasks: [],
      totalTasks: 0,
      highPriorityCount: 0,
    };
  }

  const sentences = transcript
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const actionHints = /\b(need to|needs to|should|must|will|follow up|schedule|review|update|send|prepare|complete|deliver)\b/i;
  const assigneeHints = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:will|should|needs to|must)\b/;
  const deadlineHints = /\b(by\s+[^.,;]+|before\s+[^.,;]+|next\s+\w+|tomorrow|today|this\s+week|next\s+week)\b/i;

  const tasks = dedupeTasks(
    sentences
      .filter((line) => actionHints.test(line))
      .slice(0, 12)
      .map((line, index) => {
        const assigneeMatch = line.match(assigneeHints);
        const deadlineMatch = line.match(deadlineHints);

        return normalizeTask(
          {
            task: line,
            assignee: assigneeMatch?.[1] ?? "Unassigned",
            deadline: deadlineMatch?.[1] ?? null,
            priority: /\b(asap|urgent|critical|high priority)\b/i.test(line)
              ? "high"
              : /\b(whenever|low priority|nice to have)\b/i.test(line)
                ? "low"
                : "medium",
            context: "Fallback extraction from the transcript.",
            dependencies: "none",
            status: "pending",
          },
          index,
        );
      })
      .filter(Boolean),
  );

  return {
    meetingSummary: reason
      ? `Fallback extraction was used because the AI chain could not complete: ${reason}`
      : "Fallback extraction was used because the AI chain could not complete.",
    tasks,
    totalTasks: tasks.length,
    highPriorityCount: tasks.filter((task) => task.priority === "High").length,
  };
};

const runChainWithLlm = async (llm, transcript) => {
    const cleanerChain = cleanerPrompt.pipe(llm);
    const extractorChain = extractorPrompt.pipe(llm);
    const validatorChain = validatorPrompt.pipe(llm);

    console.log("[taskchain] Stage 1: clean");
    const cleanedResponse = await cleanerChain.invoke({ transcript });
    const cleanTranscript = normalizeText(toText(cleanedResponse?.content || cleanedResponse));

    console.log("[taskchain] Stage 2: extract");
    const extractedResponse = await extractorChain.invoke({ clean_transcript: cleanTranscript });
    const extracted = parseJsonContent(extractedResponse?.content || extractedResponse, []);
    const extractedTasks = Array.isArray(extracted) ? extracted : extracted?.action_items || [];

    console.log("[taskchain] Stage 3: validate");
    const validatedResponse = await validatorChain.invoke({
      raw_tasks: JSON.stringify(extractedTasks),
      clean_transcript: cleanTranscript,
    });

    const validated = parseJsonContent(validatedResponse?.content || validatedResponse, {});
    const sourceTasks = Array.isArray(validated?.action_items) ? validated.action_items : extractedTasks;
    const normalizedTasks = dedupeTasks(
      sourceTasks
        .map((task, index) => normalizeTask(task, index))
        .filter(Boolean),
    );

    const highPriorityCount = normalizedTasks.filter((task) => task.priority === "High").length;

  return {
    meetingSummary:
      normalizeText(validated?.meeting_summary) || "No meeting summary was generated.",
    tasks: normalizedTasks,
    totalTasks: Number(validated?.total_tasks ?? normalizedTasks.length) || normalizedTasks.length,
    highPriorityCount:
      Number(validated?.high_priority_count ?? highPriorityCount) || highPriorityCount,
  };
};

export async function runMeetflowChain(transcript) {
  const providers = getAvailableLlms();
  const providerErrors = [];

  for (const { provider, client } of providers) {
    try {
      const result = await runChainWithLlm(client, transcript);

      return {
        ...result,
        provider,
      };
    } catch (error) {
      const message = error?.message || String(error);
      providerErrors.push(`${provider}: ${message}`);
      console.error(`❌ Chain error (${provider}):`, message);
    }
  }

  return buildFallbackResult(transcript, providerErrors.join(" | "));
}

export const generateTasks = runMeetflowChain;