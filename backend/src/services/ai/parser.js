import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
// services/ai/parser.js
import { JsonOutputParser } from "@langchain/core/output_parsers";

export const jsonParser = new JsonOutputParser();

const taskSchema = z.array(
  z.object({
    task: z.string(),
    assignee: z.string().nullable(),
    deadline: z.string().nullable(),
    priority: z.enum(["low", "medium", "high"]),
  })
);

export const parser = StructuredOutputParser.fromZodSchema(taskSchema);