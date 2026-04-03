// services/ai/prompt.js
import { ChatPromptTemplate } from "@langchain/core/prompts";

// ─── Chain 1: Cleaner — Speaker Aware ─────────────────────
export const cleanerPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a transcript cleaning specialist.

  CRITICAL — SPEAKER DETECTION RULES:
  - Preserve ALL speaker labels exactly as they appear
    Example: "Rohan:", "Aisha:", "Dev:" — never remove these
  - If transcript has "Speaker 1:" replace with actual name
    if mentioned anywhere in conversation
  - Keep "I'll", "I will", "I can", "let me" — these indicate 
    self-assignment and are critical for task ownership
  - Remove only: filler words (um, uh, like, you know)
  - Fix broken sentences but keep speaker attribution intact

  Return only the cleaned transcript, nothing else.`],
  ["human", "Clean this transcript:\n\n{transcript}"]
]);

// ─── Chain 2: Extractor — Commitment Detection ────────────
export const extractorPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are an expert meeting analyst specializing 
  in detecting WHO committed to WHAT in conversations.

  SPEAKER COMMITMENT DETECTION RULES:

  1. SELF-ASSIGNMENT — Person assigns task to themselves:
     - "I'll do X" → assignee = that speaker
     - "I will X" → assignee = that speaker  
     - "Let me X" → assignee = that speaker
     - "I can handle X" → assignee = that speaker
     - "I'll fix that" → assignee = that speaker
     Example: "Aisha: I'll stabilize the response today"
     → assignee: "Aisha"

  2. DIRECT ASSIGNMENT — Someone assigns task to another:
     - "Aisha, can you X" → assignee = Aisha
     - "Dev should X" → assignee = Dev
     - "Rohan, please X" → assignee = Rohan
     Example: "Rohan: Aisha please do that first"
     → assignee: "Aisha"

  3. TEAM ASSIGNMENT — No clear owner:
     - "We should X" → assignee = "unassigned"
     - "Can we X" → assignee = "unassigned"
     - "Let's X" → assignee = "unassigned"

  4. IMPLICIT ASSIGNMENT — Based on context:
     - If Aisha is discussing a bug she owns → she's assignee
     - If Dev is the only frontend person → frontend tasks = Dev

  5. SPEAKER-FIRST ASSIGNMENT — Use the detected speaker list:
     - Prefer a named speaker in the transcript over any pronoun
     - If multiple names appear, assign to the person who states
       the commitment or receives a direct assignment
     - If the transcript says "X helping Y" or "X support Y",
       assign to X (the helper/executor), not Y

  PRIORITY DETECTION:
  - high: "before anything else", "today", "urgent", 
          "blocking", "can't ship", "ASAP", "crashed"
  - medium: "this sprint", "this week", "soon"
  - low: "next sprint", "later", "small thing", "someday"

  KNOWN SPEAKERS FROM PRE-PARSE: {speakers}
  - Treat this list as canonical speaker identities.
  - assignee must be one of these speakers or "unassigned".
  - If commitment phrase uses pronouns (I, I'll, we), resolve to the active speaker.
  - If a task is support-related, map the owner to the helper.

  Return ONLY this exact JSON, nothing else:
  {{
    "speakers": ["Rohan", "Aisha", "Dev", "Kavya", "Imran"],
    "action_items": [
      {{
        "task": "specific action to be done",
        "assignee": "exact speaker name or unassigned",
        "assigned_by": "who gave the task or self",
        "commitment_phrase": "exact words that show commitment",
        "supporting": "person being helped or none",
        "deadline": "specific date or not set",
        "priority": "high | medium | low",
        "context": "one line why this task came up",
        "dependencies": "blocked by what or none"
      }}
    ]
  }}`],
  ["human", "Analyze this transcript:\n\n{clean_transcript}\n\nKnown speakers: {speakers}"]
]);

// ─── Chain 3: Validator — Enrich & Finalize ───────────────
export const validatorPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a task quality validator and enricher.

  Given extracted action items with speaker info, your job:

  1. VALIDATE ASSIGNEES:
     - If assignee is "I" or pronoun → replace with actual 
       speaker name from commitment_phrase context
     - If assignee is clearly wrong → fix using 
       assigned_by and commitment_phrase fields
    - Never leave pronouns as assignee names
    - assignee must be in known speakers list or "Unassigned"
    - For support/help tasks, set assignee to the helper/executor
      and keep the helped person in context/supporting

  2. VALIDATE TASKS:
     - Sharpen vague tasks: "fix that" → 
       "Fix API response structure for frontend"
     - Remove duplicate or overlapping tasks
     - Merge similar tasks under one assignee

  3. ENRICH OUTPUT:
     - Generate 2-line meeting summary
     - Count per-assignee task breakdown
     - Add status: "pending" to all

  Return ONLY this exact JSON, nothing else:
  {{
    "meeting_summary": "2 line summary of meeting",
    "speakers_detected": ["Rohan", "Aisha", "Dev"],
    "action_items": [
      {{
        "task": "specific sharpened action",
        "assignee": "correct speaker name",
        "supporting": "person being helped or none",
        "deadline": "date or not set",
        "priority": "high | medium | low",
        "context": "why this came up",
        "dependencies": "blocked by X or none",
        "status": "pending"
      }}
    ],
    "total_tasks": number,
    "high_priority_count": number,
    "tasks_per_assignee": {{
      "Aisha": 3,
      "Dev": 2,
      "Imran": 1
    }}
  }}`],
  ["human", 
   "Raw extracted data:\n{raw_tasks}\n\nTranscript:\n{clean_transcript}\n\nKnown speakers: {speakers}"]
]);