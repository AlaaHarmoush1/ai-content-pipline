import { researcherAgent } from "./agents/researcher/researcher.agent.js";
import { editorAgent }     from "./agents/editor/editor.agent.js";
import { writerAgent }     from "./agents/writer/writer.js";

/**
 * runPipeline
 * Chains Agent 1 → Agent 2 → Agent 3 in sequence.
 * Each agent receives the structured JSON output of the previous one.
 *
 * @param {string} topic - The topic typed by the user
 * @returns {object}     - Final result from the editor agent
 */
async function runPipeline(topic) {
  // ── AGENT 1 ── Research ──────────────────────────────────────────────────
  console.log("🔍  AGENT 1 — Researcher starting...");
  const research = await researcherAgent(topic);
  console.log("\n✅  AGENT 1 — Research complete");
  console.log("   Facts found   :", research.facts.length);
  console.log("   Sources found :", research.sources.length, "\n");

  // ── AGENT 2 ── Write ─────────────────────────────────────────────────────
  console.log("✍️   AGENT 2 — Writer starting...");
  const draft = await writerAgent(research);
  console.log("\n✅  AGENT 2 — Draft complete");
  console.log("   Title         :", draft.title, "\n");

  // ── AGENT 3 ── Edit ──────────────────────────────────────────────────────
  console.log("🧐  AGENT 3 — Editor starting...");
  const finalResult = await editorAgent(draft);
  console.log("\n✅  AGENT 3 — Editing complete");
  console.log("   Score         :", finalResult.score, "/ 10");
  console.log("   Edit notes    :", finalResult.edit_notes, "\n");

  return finalResult;
}

export { runPipeline };