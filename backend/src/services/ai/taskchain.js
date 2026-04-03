import { getAvailableLlms } from "./llm.js";
import { cleanerPrompt, extractorPrompt, validatorPrompt } from "./prompt.js";

const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();
const MAX_TRANSCRIPT_CHARS = Number(process.env.AI_MAX_TRANSCRIPT_CHARS || 6000);

const compactError = (error) =>
  normalizeText(error?.message || String(error || "")).slice(0, 220);

const isRateLimitError = (message) =>
  /\b(429|rate\s*limit|quota|too many requests|limit exceeded|resource exhausted)\b/i.test(
    String(message || ""),
  );

const truncateTranscript = (transcript) => {
  const value = typeof transcript === "string" ? transcript : "";
  if (value.length <= MAX_TRANSCRIPT_CHARS) {
    return value;
  }

  return value.slice(0, MAX_TRANSCRIPT_CHARS);
};

function extractSpeakersFromTranscript(transcript) {
  if (typeof transcript !== "string") {
    return [];
  }

  // Find simple "Name:" speaker markers while still allowing uppercase names.
  const speakerRegex = /^([A-Z][a-z]+|[A-Z]{2,})(?:\s+[A-Z][a-z]+|\s+[A-Z]{2,}){0,2}:/gm;
  const matches = [...transcript.matchAll(speakerRegex)];
  const speakers = [...new Set(matches.map((m) => normalizeText(m[1])))]
    .filter(Boolean)
    .slice(0, 20);

  console.log("👥 Speakers detected:", speakers);
  return speakers;
}

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

const findSpeakerInText = (text, speakers) => {
  const source = normalizeText(text).toLowerCase();
  if (!source || !Array.isArray(speakers) || !speakers.length) {
    return null;
  }

  for (const speaker of speakers) {
    const name = normalizeText(speaker);
    if (!name) continue;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const wholeNameRegex = new RegExp(`\\b${escaped}\\b`, "i");
    if (wholeNameRegex.test(source)) {
      return name;
    }

    const firstName = name.split(/\s+/)[0];
    if (firstName) {
      const firstNameRegex = new RegExp(`\\b${firstName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (firstNameRegex.test(source)) {
        return name;
      }
    }
  }

  return null;
};

const resolveAssignee = (task, speakers) => {
  const knownSpeakers = Array.isArray(speakers) ? speakers : [];
  const byLower = new Map(knownSpeakers.map((s) => [normalizeText(s).toLowerCase(), normalizeText(s)]));

  const rawAssignee = normalizeText(task?.assignee);
  if (rawAssignee && !/^(i|me|myself|we|us|our|team)$/i.test(rawAssignee)) {
    const direct = byLower.get(rawAssignee.toLowerCase());
    if (direct) return direct;

    const matchedFromAssignee = findSpeakerInText(rawAssignee, knownSpeakers);
    if (matchedFromAssignee) return matchedFromAssignee;
  }

  const assignedByMatch = findSpeakerInText(task?.assigned_by, knownSpeakers);
  if (assignedByMatch) return assignedByMatch;

  const commitmentMatch = findSpeakerInText(task?.commitment_phrase, knownSpeakers);
  if (commitmentMatch) return commitmentMatch;

  return "Unassigned";
};

const normalizeTask = (task, index, speakers = []) => {
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
    assignee: resolveAssignee(task, speakers),
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

const tokenize = (text) =>
  normalizeText(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 2);

const extractSpeakerTurns = (transcript) => {
  const turns = [];
  if (typeof transcript !== "string") return turns;

  const turnRegex = /(?:^|[\r\n]|[.!?]\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*:\s*([\s\S]*?)(?=(?:[\r\n]|[.!?]\s+)[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\s*:|$)/g;
  let match;

  while ((match = turnRegex.exec(transcript)) !== null) {
    turns.push({
      speaker: normalizeText(match[1]),
      content: normalizeText(match[2]),
    });
  }

  return turns;
};

const inferAssigneeFromTranscript = (taskTitle, transcript, speakers) => {
  const known = new Set((speakers || []).map((s) => normalizeText(s).toLowerCase()));
  const turns = extractSpeakerTurns(transcript);
  const taskTokens = tokenize(taskTitle);

  if (!taskTokens.length || !turns.length) {
    return null;
  }

  let bestMatch = { speaker: null, score: 0 };

  for (const turn of turns) {
    if (!known.has(turn.speaker.toLowerCase())) continue;
    const contentTokens = new Set(tokenize(turn.content));
    let score = 0;

    for (const token of taskTokens) {
      if (contentTokens.has(token)) score += 1;
    }

    if (score > bestMatch.score) {
      bestMatch = { speaker: turn.speaker, score };
    }
  }

  return bestMatch.score >= 2 ? bestMatch.speaker : null;
};

const buildFallbackResult = (transcript, reason = "", speakers = []) => {
  if (typeof transcript !== "string" || !transcript.trim()) {
    return {
      meetingSummary: "No transcript was provided.",
      tasks: [],
      totalTasks: 0,
      highPriorityCount: 0,
      speakers_detected: speakers,
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
          speakers,
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
    speakers_detected: speakers,
  };
};

const runChainWithLlm = async (llm, transcript, speakers) => {
    const cleanerChain = cleanerPrompt.pipe(llm);
    const extractorChain = extractorPrompt.pipe(llm);
    const validatorChain = validatorPrompt.pipe(llm);

    console.log("[taskchain] Stage 1: clean");
    const cleanedResponse = await cleanerChain.invoke({ transcript });
    const cleanTranscript = normalizeText(toText(cleanedResponse?.content || cleanedResponse));

    console.log("[taskchain] Stage 2: extract");
    const extractedResponse = await extractorChain.invoke({
      clean_transcript: cleanTranscript,
      speakers: speakers.join(", "),
    });
    const extracted = parseJsonContent(extractedResponse?.content || extractedResponse, []);
    const extractedTasks = Array.isArray(extracted) ? extracted : extracted?.action_items || [];

    console.log("[taskchain] Stage 3: validate");
    const validatedResponse = await validatorChain.invoke({
      raw_tasks: JSON.stringify(extractedTasks),
      clean_transcript: cleanTranscript,
      speakers: speakers.join(", "),
    });

    const validated = parseJsonContent(validatedResponse?.content || validatedResponse, {});
    const sourceTasks = Array.isArray(validated?.action_items) ? validated.action_items : extractedTasks;
    const normalizedTasks = dedupeTasks(
      sourceTasks
        .map((task, index) => normalizeTask(task, index, speakers))
        .filter(Boolean),
    ).map((task) => {
      if (task.assignee !== "Unassigned") {
        return task;
      }

      const inferred = inferAssigneeFromTranscript(task.title, cleanTranscript, speakers);
      return inferred ? { ...task, assignee: inferred } : task;
    });

    const highPriorityCount = normalizedTasks.filter((task) => task.priority === "High").length;

  return {
    meetingSummary:
      normalizeText(validated?.meeting_summary) || "No meeting summary was generated.",
    tasks: normalizedTasks,
    totalTasks: Number(validated?.total_tasks ?? normalizedTasks.length) || normalizedTasks.length,
    highPriorityCount:
      Number(validated?.high_priority_count ?? highPriorityCount) || highPriorityCount,
    speakers_detected: Array.isArray(validated?.speakers_detected)
      ? validated.speakers_detected
      : speakers,
  };
};

export async function runMeetflowChain(transcript) {
  const truncatedTranscript = truncateTranscript(transcript);
  const speakers = extractSpeakersFromTranscript(truncatedTranscript);
  const providers = getAvailableLlms();
  const providerErrors = [];

  for (const { provider, client } of providers) {
    try {
      const result = await runChainWithLlm(client, truncatedTranscript, speakers);

      return {
        ...result,
        provider,
      };
    } catch (error) {
      const message = compactError(error);
      providerErrors.push(`${provider}: ${message}`);
      console.error(`❌ Chain error (${provider}):`, message);
    }
  }

  const allRateLimited = providerErrors.length > 0 && providerErrors.every(isRateLimitError);
  const fallbackReason = allRateLimited
    ? "All AI providers are temporarily rate-limited. Please retry in a few minutes."
    : "All AI providers failed. Using fallback extraction.";

  return buildFallbackResult(truncatedTranscript, fallbackReason, speakers);
}

export const generateTasks = runMeetflowChain;