import { callClaudeJSON } from "../../utils/claudeClient.js";
import { SYSTEM_PROMPT } from "./researcher.prompt.js";
import { searchWeb } from "../../helper/seachWeb.helper.js";
import { formatResultsForClaude } from "./researcher.transform.js";
import { ResearcherSchema } from "./researcher.schema.js";

/**
 * researcherAgent
 *
 * Purpose:
 * Acts as the "Researcher" in the content pipeline. It gathers raw data from the web,
 * transforms it into a structured format suitable for an LLM, and extracts only factual,
 * structured insights using Claude.
 *
 * Flow:
 * 1. Fetch raw search results based on the topic from SERPER
 * 2. Convert results into a clean, readable text format for the LLM
 * 3. Send a structured prompt to Claude to extract factual information
 * 4. Validate and enforce schema consistency on the response
 *
 * @param {string} topic - The subject to research (user input)
 * @returns {object} - Structured, validated research data matching ResearcherSchema
 *
 * Notes:
 * - Assumes searchWeb returns relevant and reasonably clean results
 * - Claude is expected to strictly follow SYSTEM_PROMPT instructions (no hallucinations)
 * - Schema validation ensures downstream agents receive predictable data
 */
export async function researcherAgent(topic) {
  
  // Step 1: Fetch raw search results from the web
  const rawResults = await searchWeb(topic);

  // Step 2: Transform raw search results into a structured text format
  // This improves LLM comprehension and reduces noise from raw HTML or metadata
  const resultsText = formatResultsForClaude(rawResults);

  // Step 3: Construct the user message for Claude
  // The prompt explicitly restricts output to factual extraction only
  // Using template literals ensures clean formatting and readability
  const userMessage = `
Topic: "${topic}"

Extract ONLY factual information from these search results:

${resultsText}
  `.trim(); // trim() removes unintended leading/trailing whitespace

  // Step 4: Call Claude to extract structured JSON data
  const extracted = await callClaudeJSON(SYSTEM_PROMPT, userMessage);

  // Step 5: Validate and normalize the output using a schema
  // This guards against malformed or incomplete LLM responses
  // Throws an error if validation fails, ensuring data integrity for the pipeline
  return ResearcherSchema.parse(extracted);
}