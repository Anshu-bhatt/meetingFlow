// services/ai/prompt.js
import { ChatPromptTemplate } from "@langchain/core/prompts";

export const cleanerPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a transcript cleaning specialist.
    - Fix speaker labels using names if mentioned
    - Remove filler words (um, uh, like, you know)
    - Fix broken sentences
    - Keep all commitments and task-related content intact
    Return only the cleaned transcript, nothing else.`],
  ["human", "Clean this transcript:\n\n{transcript}"]
]);

export const extractorPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a precise meeting action item extractor.
    STRICT RULES:
    - Extract ONLY tasks explicitly committed by someone
    - Never extract vague discussions or opinions
    - Priority detection:
      * high: urgent, blocker, ASAP, today, critical
      * medium: this week, soon, follow up
      * low: someday, nice to have, eventually
    
    Return ONLY a raw JSON array, nothing else:
    [{{
        "task": "specific action",
        "assignee": "first name only",
        "deadline": "date or not set",
        "priority": "high|medium|low",
        "context": "one line why this came up",
        "dependencies": "blocked by X or none"
    }}]`],
  ["human", "Extract action items:\n\n{clean_transcript}"]
]);

export const validatorPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a task quality validator.
    1. VALIDATE: Sharpen vague tasks, fix assignees, 
       correct priority
    2. ENRICH: Add 2-line meeting summary, count tasks
    3. DEDUPLICATE: Merge overlapping tasks
    
    Return ONLY this exact JSON:
    {{
        "meeting_summary": "2 line summary",
        "action_items": [{{
            "task": "string",
            "assignee": "string", 
            "deadline": "string",
            "priority": "high|medium|low",
            "context": "string",
            "dependencies": "string",
            "status": "pending"
        }}],
        "total_tasks": number,
        "high_priority_count": number
    }}`],
  ["human", 
   "Raw tasks: {raw_tasks}\n\nTranscript: {clean_transcript}"]
]);