import { z } from "zod";

/**
 * ResearcherSchema
 *
 * Purpose:
 * Defines and enforces the structure of the data returned by the Researcher agent.
 * This ensures that downstream agents (e.g., Writer, Editor) receive predictable,
 * validated input and reduces the risk of runtime errors caused by malformed LLM output.
 *
 * Why this matters:
 * LLM responses can be inconsistent or incorrectly formatted. Using a schema validator
 * like Zod guarantees that the output conforms to the expected structure or throws
 * an error early, making issues easier to detect and debug.
 *
 * Structure:
 * - facts:   Array of factual statements extracted from sources
 * - sources: Array of source URLs or references used to derive those facts
 *
 * Assumptions:
 * - facts are concise, standalone strings (no nested objects)
 * - sources are valid strings (typically URLs, but not strictly enforced here)
 *
 * Edge Cases:
 * - If the LLM returns missing or incorrectly typed fields, `.parse()` will throw
 * - Empty arrays are allowed, but may indicate weak or insufficient research data
 *
 * Potential Improvement:
 * - Add stricter validation (e.g., URL format validation for sources)
 * - Enforce minimum lengths if needed to guarantee content quality
 */
export const ResearcherSchema = z.object({
  // List of extracted factual statements (must be strings)
  facts: z.array(z.string()),

  // List of source references (e.g., URLs) corresponding to the facts
  sources: z.array(z.string())
});