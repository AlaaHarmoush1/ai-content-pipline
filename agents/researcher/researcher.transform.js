/**
 * formatResultsForClaude
 *
 * Purpose:
 * Transforms raw search engine response data into a clean, structured text format
 * optimized for LLM consumption. This reduces noise and improves extraction quality
 * by presenting only the most relevant fields in a consistent layout.
 *
 * Why this matters:
 * LLMs perform better when input is well-structured and predictable. This function
 * standardizes diverse search result formats into a readable prompt-friendly string.
 *
 * @param {object} rawData - Raw search response (e.g., from Serper or similar API)
 * @returns {string} - Formatted string ready to be injected into an LLM prompt
 *
 * Assumptions:
 * - rawData may contain optional fields (answerBox, knowledgeGraph, organic)
 * - Missing fields are handled gracefully with fallbacks ("N/A")
 *
 * Edge Cases:
 * - If rawData is empty or lacks expected fields, output may be minimal or empty
 * - organic results may contain incomplete entries (handled via fallback values)
 */
export function formatResultsForClaude(rawData) {
  const lines = []; // Accumulates formatted text lines for final output

  // Include concise direct answer if available (typically from search engine answer box)
  // This is often the highest-signal content for factual queries
  if (rawData.answerBox?.answer) {
    lines.push(`ANSWER BOX:\n${rawData.answerBox.answer}\n`);
  }

  // Include knowledge graph description if present (useful for entity-based queries)
  // Provides summarized background information
  if (rawData.knowledgeGraph?.description) {
    lines.push(`KNOWLEDGE GRAPH:\n${rawData.knowledgeGraph.description}\n`);
  }

  // Process organic search results (main list of search results)
  // Ensures we only iterate if the field is a valid array
  if (Array.isArray(rawData.organic)) {
    rawData.organic.forEach((result, i) => {
      // Add a visual separator for each result to improve readability for the LLM
      lines.push(`--- RESULT ${i + 1} ---`);

      // Provide key fields with fallbacks to avoid undefined values
      // This ensures consistent structure even when data is incomplete
      lines.push(`Title  : ${result.title || "N/A"}`);
      lines.push(`URL    : ${result.link || "N/A"}`);
      lines.push(`Snippet: ${result.snippet || "N/A"}`);

      // Add an empty line for spacing between results (improves parsing clarity)
      lines.push("");
    });
  }

  // Join all lines into a single string separated by newlines
  // Final output is clean, readable, and LLM-friendly
  return lines.join("\n");
}