import { getLlm } from "./llm.js";
import { taskPrompt } from "./prompt.js";

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

    const trimmed = rawContent.trim();
    const jsonBlock = trimmed.startsWith("[")
      ? trimmed
      : trimmed.match(/\[[\s\S]*\]/)?.[0] || "[]";

    const parsed = JSON.parse(jsonBlock);
    return Array.isArray(parsed) ? parsed : [];

  } catch (error) {
    console.error("TaskChain Error:", error);
    return [];
  }
};