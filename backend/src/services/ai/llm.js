import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "../.env" });

let llmInstance = null;
const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const groqModelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const parseModelList = (value, fallback) =>
  String(value || fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const getLlm = () => {
  if (llmInstance) {
    return llmInstance;
  }

  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!googleApiKey) {
    throw new Error(
      "Missing Google API key. Set GOOGLE_API_KEY (or GEMINI_API_KEY) in backend/.env.",
    );
  }

  llmInstance = new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: googleApiKey,
    temperature: 0,
  });

  return llmInstance;
};

export const getAvailableLlms = () => {
  const llms = [];
  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;
  const googleModels = parseModelList(
    process.env.GEMINI_MODELS,
    `${modelName},gemini-1.5-flash`,
  );
  const groqModels = parseModelList(
    process.env.GROQ_MODELS,
    `${groqModelName},llama-3.1-8b-instant`,
  );

  if (googleApiKey) {
    for (const model of googleModels) {
      llms.push({
        provider: `google:${model}`,
        client: new ChatGoogleGenerativeAI({
          model,
          apiKey: googleApiKey,
          temperature: 0,
          maxOutputTokens: 1024,
        }),
      });
    }
  }

  if (groqApiKey) {
    for (const model of groqModels) {
      llms.push({
        provider: `groq:${model}`,
        client: new ChatGroq({
          apiKey: groqApiKey,
          model,
          temperature: 0,
          maxTokens: 1024,
        }),
      });
    }
  }

  if (!llms.length) {
    throw new Error(
      "Missing AI provider keys. Set GOOGLE_API_KEY (or GEMINI_API_KEY) and/or GROQ_API_KEY in backend/.env.",
    );
  }

  return llms;
};