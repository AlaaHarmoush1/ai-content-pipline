import "dotenv/config";
import express from "express";
import cors from "cors";
import { runPipeline } from "./pipeline.js";

const app = express();
app.use(express.json());
app.use(cors()); // ✅ added

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "AI Content Pipeline is running 🚀" });
});

// ── Main pipeline route ───────────────────────────────────────────────────────
// POST /generate   body: { "topic": "why AI agents are replacing SaaS tools" }
app.post("/generate", async (req, res) => {
  const { topic } = req.body;

  if (!topic || typeof topic !== "string" || topic.trim() === "") {
    return res.status(400).json({ error: 'A "topic" string is required in the request body.' });
  }

  try {
    console.log("\n========================================");
    console.log(`📥  New request — Topic: "${topic}"`);
    console.log("========================================\n");

    const result = await runPipeline(topic.trim());

    return res.status(200).json({
      success: true,
      topic,
      pipeline_result: result,
    });
  } catch (err) {
    console.error("❌  Pipeline error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀  Server running at http://localhost:${PORT}`);
  console.log(`📮  Send POST /generate  with { "topic": "..." } to run the pipeline\n`);
});