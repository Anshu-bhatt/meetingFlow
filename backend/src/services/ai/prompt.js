import { ChatPromptTemplate } from "@langchain/core/prompts";

export const taskPrompt = ChatPromptTemplate.fromTemplate(`
You extract meeting action items.

Rules:
1) Return ONLY valid JSON array. No markdown, no comments, no extra keys.
2) Extract only concrete, actionable tasks from the transcript.
3) Merge duplicates and near-duplicates into one task.
4) Keep each task concise and specific (5-20 words).
5) assignee must be a person name in transcript; otherwise null.
6) deadline must be ISO date (YYYY-MM-DD) only when explicitly stated.
7) If deadline is missing or ambiguous, set deadline to null.
8) If no real actions exist, return [].

Required schema:
[
  {{
    "task": "string",
    "assignee": "string or null",
    "deadline": "YYYY-MM-DD or null",
    "priority": "low | medium | high"
  }}
]

Transcript:
{transcript}
`);