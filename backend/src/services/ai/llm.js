import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "../.env" });

let llmInstance = null;
const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const groqModelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

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

  if (googleApiKey) {
    llms.push({
      provider: "google",
      client: new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: googleApiKey,
        temperature: 0,
      }),
    });
  }

  if (groqApiKey) {
    llms.push({
      provider: "groq",
      client: new ChatGroq({
        apiKey: groqApiKey,
        model: groqModelName,
        temperature: 0,
      }),
    });
  }

  if (!llms.length) {
    throw new Error(
      "Missing AI provider keys. Set GOOGLE_API_KEY (or GEMINI_API_KEY) and/or GROQ_API_KEY in backend/.env.",
    );
  }

  return llms;
};