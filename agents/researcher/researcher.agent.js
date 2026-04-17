import { callClaudeJSON } from "../../utils/claudeClient.js";
import { SYSTEM_PROMPT } from "./researcher.prompt.js";
import { searchWeb } from "../../helper/seachWeb.helper.js";
import { formatResultsForClaude } from "./researcher.transform.js";
import { ResearcherSchema } from "./researcher.schema.js";

export async function researcherAgent(topic) {
  const rawResults = await searchWeb(topic);

  const resultsText = formatResultsForClaude(rawResults);

  const userMessage = `
Topic: "${topic}"

Extract ONLY factual information from these search results:

${resultsText}
  `.trim();

  const extracted = await callClaudeJSON(SYSTEM_PROMPT, userMessage);

  return ResearcherSchema.parse(extracted);
}