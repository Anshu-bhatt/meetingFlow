import { ChatPromptTemplate } from "@langchain/core/prompts";

export const taskPrompt = ChatPromptTemplate.fromTemplate(`
You are a strict JSON generator.

Extract ONLY actionable tasks.

Return ONLY valid JSON.

Schema:
[
  {{
    "task": "string",
    "assignee": "string or null",
    "deadline": "string or null",
    "priority": "low | medium | high"
  }}
]

If no tasks found, return [].

Transcript:
{transcript}
`);