import "dotenv/config";
import { runPipeline } from "./pipeline.js";

/**
 * CLI Runner
 * Lets you test the pipeline directly from your terminal without needing
 * to send an HTTP request.
 *
 * Usage:
 *   node cli.js
 *   node cli.js "your custom topic here"
 */

// Use the exact required test topic by default, or accept a CLI argument
const topic = process.argv[2] || "why AI agents are replacing SaaS tools";

console.log("╔════════════════════════════════════════════╗");
console.log("║      AI Content Pipeline — CLI Mode        ║");
console.log("╚════════════════════════════════════════════╝");
console.log(`\nTopic: "${topic}"\n`);

runPipeline(topic)
  .then((result) => {
    console.log("\n╔════════════════════════════════════════════╗");
    console.log("║            FINAL PIPELINE OUTPUT           ║");
    console.log("╚════════════════════════════════════════════╝\n");
    console.log(`Score      : ${result.score} / 10`);
    console.log(`Edit Notes : ${result.edit_notes}\n`);
    console.log("─── FINAL POST ─────────────────────────────\n");
    console.log(result.final_post);
    console.log("\n─────────────────────────────────────────────");
    console.log("✅  Pipeline complete.");
  })
  .catch((err) => {
    console.error("\n❌  Pipeline failed:", err.message);
    process.exit(1);
  });