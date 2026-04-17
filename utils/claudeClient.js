import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * callClaude
 * A thin wrapper around the Anthropic messages API.
 * Every agent calls this function — keeping API logic in one place.
 *
 * @param {string} systemPrompt  - The agent's role / persona / rules
 * @param {string} userMessage   - The actual task or data to process
 * @returns {string}             - The raw text response from Claude
 */
async function callClaude(systemPrompt, userMessage) {
  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  // The response content is an array; grab the first text block
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) throw new Error("Claude returned no text content.");

  return textBlock.text;
}

/**
 * callClaudeJSON
 * Same as callClaude but automatically parses the response as JSON.
 * Strips markdown code fences that Claude sometimes wraps JSON in.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {object} - Parsed JSON object
 */
async function callClaudeJSON(systemPrompt, userMessage) {
  const raw = await callClaude(systemPrompt, userMessage);

  // Strip ```json ... ``` or ``` ... ``` fences if present
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("⚠️  Failed to parse Claude response as JSON.\nRaw output:\n", raw);
    throw new Error("Claude did not return valid JSON. See console for raw output.");
  }
}

export { callClaude, callClaudeJSON };