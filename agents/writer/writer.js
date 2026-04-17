import { callClaudeJSON } from "../../utils/claudeClient.js";
import {SYSTEM_PROMPT} from "./writer.prompt.js";
import { generateWriterPrompt } from "../../helper/generateWriterPrompt.helper.js";

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 2 — WRITER
//
// Responsibility:
//   Takes the structured research JSON from Agent 1 and produces a full,
//   structured blog post grounded ONLY in those real facts.
//
// Input  : { facts: string[], sources: string[] }  ← from Agent 1
// Output : { title, intro, sections: [{ heading, content }], cta }
// ─────────────────────────────────────────────────────────────────────────────

/**
 * writerAgent
 * Agent 2: takes research output and writes a structured blog post.
 *
 * @param {{ facts: string[], sources: string[] }} research - Output from Agent 1
 * @returns {{ title: string, intro: string, sections: object[], cta: string }}
 */
async function writerAgent(research) {
  const { facts, sources } = research;

  const userMessage = generateWriterPrompt(facts, sources);

  const post = await callClaudeJSON(SYSTEM_PROMPT, userMessage);

  // Basic validation
  if (!post.title || !post.intro || !Array.isArray(post.sections) || !post.cta) {
    throw new Error("Writer agent received malformed JSON from Claude.");
  }

  console.log(`   Sections written: ${post.sections.length}`);

  return post;
}

export { writerAgent };