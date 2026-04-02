import { ChatGroq } from "@langchain/groq";

let llmInstance = null;

export const getLlm = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing. Set it in backend/.env before calling extraction.");
  }

  if (!llmInstance) {
    llmInstance = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile", // Current supported model
      temperature: 0.2,
    });
  }

  return llmInstance;
};