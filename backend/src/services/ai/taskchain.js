import { getAvailableLlms } from "./llm.js";
import { unifiedExtractionPrompt } from "./prompt.js";

const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();
const MAX_TRANSCRIPT_CHARS = Number(process.env.AI_MAX_TRANSCRIPT_CHARS || 6000);
const SPEAKER_STOPWORDS = new Set([
  "i",
  "me",
  "my",
  "mine",
  "we",
  "us",
  "our",
  "ours",
  "you",
  "your",
  "yours",
  "they",
  "them",
  "their",
  "where",
  "when",
  "what",
  "why",
  "how",
  "this",
  "that",
  "there",
  "here",
  "team",
  "everyone",
]);

const toDisplayName = (value) =>
  (() => {
    const normalized = normalizeText(value);
    if (!normalized) return "";

    if (/^[a-z]+\d+$/i.test(normalized)) {
      return normalized.toLowerCase();
    }

    return normalized
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  })();

const isValidSpeakerCandidate = (value) => {
  const candidate = normalizeText(value);
  if (!candidate) return false;
  if (candidate.length < 2 || candidate.length > 60) return false;

  const normalized = candidate.toLowerCase();
  if (SPEAKER_STOPWORDS.has(normalized)) return false;

  if (/^(speaker\s*\d+|participant\s*\d+)$/i.test(candidate)) return false;

  return true;
};

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

  const speakers = [];
  const speakerSet = new Set();
  const addSpeaker = (raw) => {
    const candidate = toDisplayName(raw);
    if (!isValidSpeakerCandidate(candidate)) return;
    const key = candidate.toLowerCase();
    if (speakerSet.has(key)) return;
    speakerSet.add(key);
    speakers.push(candidate);
  };

  // Accept label formats like "Emp1:", "emp2:", "John:", "Team Lead:".
  const speakerRegex = /^\s*([A-Za-z][A-Za-z0-9._-]*(?:\s+[A-Za-z][A-Za-z0-9._-]*){0,2})\s*:/gm;
  let speakerMatch;
  while ((speakerMatch = speakerRegex.exec(transcript)) !== null) {
    addSpeaker(speakerMatch[1]);
    if (speakers.length >= 20) break;
  }

  // Capture assignee-like names from sentence patterns.
  const assignmentRegex = /\b([A-Za-z][A-Za-z0-9._-]*(?:\s+[A-Za-z][A-Za-z0-9._-]*)?)\s+(?:will|should|needs to|must|can)\b/gi;
  let assignmentMatch;
  while ((assignmentMatch = assignmentRegex.exec(transcript)) !== null) {
    addSpeaker(assignmentMatch[1]);
    if (speakers.length >= 20) break;
  }

  // Explicit support for ids such as emp1, emp2 from scripts.
  const employeeIdRegex = /\b(emp\d+)\b/gi;
  let employeeMatch;
  while ((employeeMatch = employeeIdRegex.exec(transcript)) !== null) {
    addSpeaker(employeeMatch[1]);
    if (speakers.length >= 20) break;
  }

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

  // Already in ISO format — return directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Fallback: resolve common relative dates the LLM might not have converted
  const lower = trimmed.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toISO = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  if (lower === "today") {
    return toISO(today);
  }

  if (lower === "tomorrow") {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return toISO(d);
  }

  // "in N days" pattern
  const inDaysMatch = lower.match(/^in\s+(\d+)\s+days?$/);
  if (inDaysMatch) {
    const d = new Date(today);
    d.setDate(d.getDate() + parseInt(inDaysMatch[1], 10));
    return toISO(d);
  }

  // "next week" → next Monday
  if (lower === "next week") {
    const d = new Date(today);
    const daysUntilMon = ((1 - d.getDay() + 7) % 7) || 7;
    d.setDate(d.getDate() + daysUntilMon);
    return toISO(d);
  }

  // "this week" / "end of this week" → this Friday
  if (lower === "this week" || lower === "end of this week" || lower === "end of week") {
    const d = new Date(today);
    const daysUntilFri = ((5 - d.getDay() + 7) % 7) || 7;
    d.setDate(d.getDate() + daysUntilFri);
    return toISO(d);
  }

  // "next <dayname>" pattern
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const nextDayMatch = lower.match(/^next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (nextDayMatch) {
    const targetDay = dayNames.indexOf(nextDayMatch[1]);
    const d = new Date(today);
    const daysUntil = ((targetDay - d.getDay() + 7) % 7) || 7;
    d.setDate(d.getDate() + daysUntil);
    return toISO(d);
  }

  // Try generic Date parse as last resort
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

    // Keep explicit assignee names even when transcripts lack speaker labels.
    if (/^[A-Za-z][A-Za-z\s.'-]{1,60}$/.test(rawAssignee)) {
      return toDisplayName(rawAssignee);
    }
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

  const turnRegex = /(?:^|[\r\n]|[.!?]\s+)([A-Za-z][A-Za-z0-9._-]*(?:\s+[A-Za-z][A-Za-z0-9._-]*){0,2})\s*:\s*([\s\S]*?)(?=(?:[\r\n]|[.!?]\s+)[A-Za-z][A-Za-z0-9._-]*(?:\s+[A-Za-z][A-Za-z0-9._-]*){0,2}\s*:|$)/g;
  let match;

  while ((match = turnRegex.exec(transcript)) !== null) {
    turns.push({
      speaker: toDisplayName(match[1]),
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

const inferAssigneeFromSentencePatterns = (taskTitle, transcript) => {
  const source = typeof transcript === "string" ? transcript : "";
  if (!source || !taskTitle) return null;

  const escapedTask = taskTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const windowRegex = new RegExp(`([^.!?\n]{0,220}${escapedTask}[^.!?\n]{0,220})`, "i");
  const windowMatch = source.match(windowRegex);
  const windowText = windowMatch?.[1] || source;

  const patterns = [
    /\b([A-Za-z][A-Za-z0-9._-]*(?:\s+[A-Za-z][A-Za-z0-9._-]*)?)\s+(?:will|should|needs to|must|can)\b/i,
    /\b([A-Za-z][A-Za-z0-9._-]*(?:\s+[A-Za-z][A-Za-z0-9._-]*)?),\s*(?:please\s+)?(?:can you|could you|will you)\b/i,
    /\bassign(?:ed)?\s+to\s+([A-Za-z][A-Za-z0-9._-]*(?:\s+[A-Za-z][A-Za-z0-9._-]*)?)\b/i,
  ];

  for (const pattern of patterns) {
    const matched = windowText.match(pattern);
    if (matched?.[1]) {
      const candidate = toDisplayName(matched[1]);
      if (isValidSpeakerCandidate(candidate)) {
        return candidate;
      }
    }
  }

  return null;
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

const getCurrentDateISO = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const runChainWithLlm = async (llm, transcript, speakers) => {
    const extractionChain = unifiedExtractionPrompt.pipe(llm);
    const currentDate = getCurrentDateISO();

    console.log(`[taskchain] Running extraction with current_date=${currentDate}...`);
    const response = await extractionChain.invoke({
      transcript,
      speakers: speakers.join(", "),
      current_date: currentDate,
    });

    const validated = parseJsonContent(response?.content || response, {});
    const extractedTasks = Array.isArray(validated?.action_items) ? validated.action_items : [];

    const normalizedTasks = dedupeTasks(
      extractedTasks
        .map((task, index) => normalizeTask(task, index, speakers))
        .filter(Boolean),
    ).map((task) => {
      if (task.assignee !== "Unassigned") {
        return task;
      }

        const inferredFromTurns = inferAssigneeFromTranscript(task.title, transcript, speakers);
        if (inferredFromTurns) {
          return { ...task, assignee: inferredFromTurns };
        }

        const inferredFromSentence = inferAssigneeFromSentencePatterns(task.title, transcript);
        return inferredFromSentence ? { ...task, assignee: inferredFromSentence } : task;
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