# AI Content Pipeline — Architecture & Technical Documentation

> A 3-agent sequential AI pipeline built with Node.js and Express.
> Topic in → Real research → Structured blog post → Quality-scored & rewritten output.

---

## Table of Contents

1. [What This Project Does](#what-this-project-does)
2. [Architecture Overview](#architecture-overview)
3. [Why 3 Separate Agents](#why-3-separate-agents)
4. [How Agents Communicate](#how-agents-communicate)
5. [File Structure](#file-structure)
6. [Agent Deep Dives](#agent-deep-dives)
7. [The Editor Rewrite Loop](#the-editor-rewrite-loop--most-important)
8. [Tech Stack Decisions](#tech-stack-decisions)
9. [Setup and Running](#setup-and-running)
10. [API Reference](#api-reference)
11. [What I'd Add With More Time](#what-id-add-with-more-time)

---

## What This Project Does

A user types a topic. Three AI agents run in sequence — each living in its own
folder, with its own prompt, schema, helpers, and responsibility. The final
result is a quality-assured, publish-ready blog post.

```
"why AI agents are replacing SaaS tools"
              │
              ▼
    ┌───────────────────────┐
    │   AGENT 1             │
    │   Researcher          │  Searches the web. Returns real facts + source URLs.
    │   agents/researcher/  │
    └──────────┬────────────┘
               │  { facts[], sources[] }
               ▼
    ┌───────────────────────┐
    │   AGENT 2             │
    │   Writer              │  Writes a structured blog post from those facts only.
    │   agents/writer/      │
    └──────────┬────────────┘
               │  { title, intro, sections[], cta }
               ▼
    ┌───────────────────────┐
    │   AGENT 3             │
    │   Editor              │  Scores 1–10. Loops rewrites until score >= 7.
    │   agents/editor/      │
    └──────────┬────────────┘
               │  { score, final_post, edit_notes }
               ▼
      Ready-to-publish blog post
```

---

## Architecture Overview

### Folder-Per-Agent Pattern

This version upgrades from single-file agents to a **folder-per-agent**
structure. Every agent owns its directory. Inside, responsibilities are split
across single-purpose files — no file does more than one job.

```
pipeline.js  (thin orchestrator — just chains the three agents)
    │
    ├── researcherAgent()    agents/researcher/researcher.agent.js
    ├── writerAgent()        agents/writer/writer.js
    └── editorAgent()        agents/editor/editor.agent.js
```

Each agent folder is independently readable, testable, and replaceable.
Swapping the Writer means touching only `agents/writer/`. Adding a fourth
agent means adding a new folder and one line in `pipeline.js`.

### Why Not One Big Prompt?

```javascript
// WRONG — one mega-prompt, not an agent architecture
const result = await claude("Research AND write AND edit a blog post about: " + topic);
```

This approach fails because:
- You cannot test each stage independently
- You cannot swap one agent without rewriting everything
- Claude loses focus trying to do three jobs at once
- You cannot add retry or rewrite logic around individual steps

The 3-agent design solves all of these. The folder-per-agent structure takes
it further — even within each agent, every concern is isolated.

---

## Why 3 Separate Agents

| Agent | Why it must be separate |
|-------|------------------------|
| Researcher | Needs a live external tool (Search API) and a strict factual mindset. Combining research with writing causes hallucination — the model fills gaps with plausible-sounding invented content. |
| Writer | Needs full creative focus on structure and prose. If it is simultaneously scoring or searching, quality drops significantly. One job: turn verified facts into a readable post. |
| Editor | Must evaluate the Writer's output from an objective position. If the same context that wrote the post is also scoring it, it cannot judge fairly. Separation creates the evaluator/executor split that is the foundation of agentic systems. |

---

## How Agents Communicate

Agents pass plain JSON objects to each other through `pipeline.js`.
No shared database, no global state, no side effects between agents.

```javascript
// Agent 1 output — fed directly into Agent 2
{
  "facts": [
    "Klarna's AI assistant handles two-thirds of customer service chats...",
    "SaaS tools require users to translate intent into interface actions..."
  ],
  "sources": [
    "https://www.klarna.com/...",
    "https://medium.com/..."
  ]
}

// Agent 2 output — fed directly into Agent 3
{
  "title": "AI Agents Are Eating SaaS",
  "intro": "The software industry is witnessing a seismic shift...",
  "sections": [
    { "heading": "The Friction Problem", "content": "..." },
    { "heading": "How AI Agents Change the Game", "content": "..." }
  ],
  "cta": "Start evaluating which workflows could be handled by agents..."
}

// Agent 3 final output
{
  "score": 7,
  "final_post": "# AI Agents Are Eating SaaS\n\n...",
  "edit_notes": "Passed threshold after 2 attempt(s) | Attempt 1: Rewrote..."
}
```

Every intermediate payload is inspectable, loggable, and replayable from
any point in the chain.

---

## File Structure

```
ai-content-pipeline/
│
├── Index.js                      Express HTTP server
│                                 POST /generate → runs the full pipeline
│                                 GET  /         → health check
│
├── pipeline.js                   Thin orchestrator
│                                 Chains the 3 agents, logs progress
│
├── cli.js                        Terminal runner — no HTTP needed for demos
│
├── agents/
│   │
│   ├── researcher/               AGENT 1 — all research logic lives here
│   │   ├── researcher.agent.js   Entry point — orchestrates the agent
│   │   ├── researcher.prompt.js  System prompt (strict extraction rules)
│   │   ├── researcher.schema.js  Zod schema — validates output shape
│   │   └── researcher.transform.js  Formats raw Serper data for Claude
│   │
│   ├── writer/                   AGENT 2 — all writing logic lives here
│   │   ├── writer.js             Entry point — calls Claude, validates output
│   │   └── writer.prompt.js      System prompt (fact-referenced writing rules)
│   │
│   └── editor/                   AGENT 3 — all editing logic lives here
│       ├── editor.agent.js       Entry point — owns the rewrite loop
│       ├── editor.scorer.js      Scores the current post via Claude
│       ├── editor.rewriter.js    Rewrites the weakest section via Claude
│       ├── editor.formatter.js   Converts post JSON → readable markdown string
│       └── editor.prompt.js      Both scoring and rewrite system prompts
│
├── helper/
│   ├── seachWeb.helper.js        Live Serper API call + raw results printer
│   └── generateWriterPrompt.helper.js  Builds the numbered fact list for Writer
│
├── utils/
│   └── claudeClient.js           Shared Claude API wrapper
│                                 callClaude()     → raw text
│                                 callClaudeJSON() → parsed + validated JSON
│
├── .env.example                  API key template — never commit .env
├── .gitignore
└── package.json
```

---

## Agent Deep Dives

### Agent 1 — Researcher

**Entry point:** `agents/researcher/researcher.agent.js`

**System prompt persona:** Meticulous fact extractor. Only reports what is
explicitly stated in the search results. Never infers, generalises, or invents.

**What it does:**
1. Calls `searchWeb()` from `helper/seachWeb.helper.js` — live Serper API call
2. Prints the full raw API response to terminal for verification
3. Passes raw results through `formatResultsForClaude()` — cleans the noise
4. Sends the cleaned results to Claude with a strict extraction system prompt
5. Validates the response shape with a **Zod schema** before returning

**Key upgrade in this version — Zod validation:**
```javascript
// researcher.schema.js
export const ResearcherSchema = z.object({
  facts: z.array(z.string()),
  sources: z.array(z.string())
});

// researcher.agent.js — last line before return
return ResearcherSchema.parse(extracted);
```
If Claude returns malformed output, Zod throws immediately with a clear
error — rather than letting bad data silently propagate to Agent 2.

**Why the two-step approach (Search API → Claude)?**
The Search API returns noisy raw data — titles, snippets, related searches,
knowledge graphs, answer boxes. Claude acts as a clean extraction layer:
read all that noise, pull out the signal, return it in a consistent shape.
Claude never searches the internet itself. It only reads what Serper returned.
This eliminates hallucination at the research stage entirely.

**Researcher prompt highlights:**
- 8 strict extraction rules including fact grounding, no hallucination, paraphrasing constraints
- Positional mapping enforced: `facts[i]` must correspond to `sources[i]`
- Contradictions handled: conflicting sources kept separate, never resolved
- Mental validation checklist Claude must complete before responding

---

### Agent 2 — Writer

**Entry point:** `agents/writer/writer.js`

**System prompt persona:** Expert blog writer. Professional tech audience.
Every claim must be traceable to a numbered fact.

**Key upgrade in this version — explicit fact referencing:**
```javascript
// generateWriterPrompt.helper.js
facts.map((f, i) => `[Fact ${i + 1}] ${f}`).join("\n")
```

Facts are numbered `[Fact 1]`, `[Fact 2]` etc. The writer system prompt
then requires Claude to cite these inline — `[Fact 1]`, `[Fact 3]` — in
the actual blog post content. This creates an auditable chain from source
URL through extracted fact through published sentence.

**Writer prompt — strictly forbidden list:**
- Vague phrases such as "research shows" or "experts say"
- Any claim without a fact reference number
- Any new statistics or examples not in the facts list

---

### Agent 3 — Editor

**Entry point:** `agents/editor/editor.agent.js`

**Key upgrade in this version — fully decomposed into single-responsibility files:**

| File | One job |
|------|---------|
| `editor.agent.js` | Owns the while loop — score, branch, iterate |
| `editor.scorer.js` | One function: call Claude, return score JSON |
| `editor.rewriter.js` | One function: rewrite one section, return updated post object |
| `editor.formatter.js` | One function: convert post object to markdown string |
| `editor.prompt.js` | Both system prompts — scorer and rewriter — in one place |

`editor.rewriter.js` also adds **null-safety guards** absent in v1:
```javascript
const sections = Array.isArray(postJSON.sections) ? postJSON.sections : [];
if (sections.length === 0) throw new Error("Invalid postJSON: sections missing");
const sectionIndex = sections.findIndex(
  (s) => s.heading?.toLowerCase?.() === weakestSection?.toLowerCase?.()
);
```
Optional chaining on both sides of the comparison prevents crashes when
Claude returns a weakest_section heading that does not exactly match.

---

## The Editor Rewrite Loop — Most Important

This is the architectural centrepiece of the pipeline and the primary
skill the role requires.

```javascript
// editor.agent.js
const MAX_ATTEMPTS = 3;
const TARGET_SCORE = 7;      // named constant — easy to tune

let currentPost = postJSON;
let attempt = 0;
let score = 0;
const editNotes = [];

while (attempt < MAX_ATTEMPTS) {
  attempt++;

  // 1. Score the current version
  const evaluation = await scorePost(currentPost);
  score = evaluation.score;

  // 2. Exit if quality threshold is met
  if (score >= TARGET_SCORE) break;

  // 3. Rewrite the weakest section — returns an updated post OBJECT
  //    so the next iteration scores the improved version, not the original
  const updatedPost = await rewriteWeakestSection(
    currentPost,
    evaluation.weakest_section,
    evaluation.weakness_reason
  );

  currentPost = updatedPost;

  editNotes.push(
    `Attempt ${attempt}: Rewrote "${evaluation.weakest_section}" → ${evaluation.weakness_reason}`
  );
}
```

### Why a while loop and not if/else?

A single `if (score < 7) { rewrite } else { pass }` only gets one attempt.
If the rewrite improves the score from 5 to 6 — still below threshold —
the old version would exit with a substandard post. The while loop keeps
iterating until the post genuinely passes, or the safety cap is reached.

### Why TARGET_SCORE is a named constant

`const TARGET_SCORE = 7` instead of the magic number `7` hardcoded in the
condition. This is a meaningful improvement from v1 — tuning the threshold
now requires changing one line, not hunting through the logic.

### Why MAX_ATTEMPTS = 3

Without a cap, a harsh scorer could loop forever burning API tokens.
Three attempts is enough to meaningfully improve a post. Standard pattern
in all production agent loops.

### Why rewriteWeakestSection returns an object, not a string

After each rewrite, the improved section is spliced back into `currentPost`
as an object. If we converted to a string, the next scoring call could not
identify sections by heading for a subsequent rewrite. The structured shape
is preserved across every iteration of the loop.

### Real terminal output from an actual run

```
Attempt 1: Score 6/10
  Weakest: "How AI Agents Change the Game"
  Reason: "Makes broad claims without concrete examples..."
  Rewrite triggered

Attempt 2: Score 7/10
  Threshold met. Loop exits cleanly.
  edit_notes: "Passed threshold after 2 attempt(s) | Attempt 1: Rewrote..."
```

---

## Tech Stack Decisions

| Choice | Why |
|--------|-----|
| Node.js | Native async/await is ideal for sequential agent chains. Fast I/O for API-heavy workloads. |
| Express | Zero overhead routing. One route (POST /generate) is all this pipeline needs. |
| ESM (import/export) | Modern module system. Cleaner imports, better tooling support, aligns with Node 18+ best practices. |
| @anthropic-ai/sdk | Official Anthropic SDK. Handles auth, retries, and response normalisation. |
| claude-opus-4-5 | Best reasoning quality for structured JSON extraction and nuanced editorial judgment. |
| Zod | Runtime schema validation at the Agent 1 output boundary. Catches bad Claude responses before they silently corrupt downstream agents. |
| Serper | Purpose-built Google Search API for AI pipelines. Returns clean JSON snippets, not raw HTML. One call, structured data back. |
| Axios | Clean promise-based HTTP client for the Serper API call. |
| dotenv | Keeps API keys out of source code. Standard security practice. |

### What was explicitly avoided

- LangChain / LlamaIndex — hides agent logic behind abstractions. The code structure itself must reflect the architecture, not a framework.
- n8n / Make / Zapier — visual builders, not real agent architecture.
- One mega-prompt — the anti-pattern described above.
- Mocked search data — Agent 1 makes a live Serper API call every run. Raw results are always printed to terminal.

---

## Setup and Running

### Prerequisites

- Node.js v18 or higher
- Anthropic API key: https://console.anthropic.com/
- Serper API key (free tier available): https://serper.dev/

### Install

```bash
git clone <your-repo-url>
cd ai-content-pipeline
npm install
```

### Configure

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
ANTHROPIC_API_KEY=sk-ant-...
SERPER_API_KEY=...
PORT=3000
```

### Important — package.json must declare ESM

Because the project uses `import/export` syntax, add this to `package.json`:

```json
{
  "type": "module"
}
```

Without this, Node will treat `.js` files as CommonJS and crash on the
first `import` statement.

### Run via CLI (simplest — best for demos and Loom recording)

```bash
node cli.js
# Runs the required test topic by default:
# "why AI agents are replacing SaaS tools"

node cli.js "your custom topic here"
# Pass any topic as a CLI argument
```

### Run via Express Server

```bash
node Index.js
```

In a separate terminal:

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "why AI agents are replacing SaaS tools"}'
```

---

## API Reference

### POST /generate

Runs the full 3-agent pipeline on the provided topic.

**Request body:**
```json
{ "topic": "why AI agents are replacing SaaS tools" }
```

**Success response (200):**
```json
{
  "success": true,
  "topic": "why AI agents are replacing SaaS tools",
  "pipeline_result": {
    "score": 7,
    "final_post": "# AI Agents Are Eating SaaS\n\n...",
    "edit_notes": "Passed threshold after 2 attempt(s) | Attempt 1: Rewrote..."
  }
}
```

**Error response (400):**
```json
{ "error": "A \"topic\" string is required in the request body." }
```

### GET /

Health check.

```json
{ "status": "AI Content Pipeline is running 🚀" }
```

---

## What I'd Add With More Time

**1. Fix the module system consistency**
`claudeClient.js` and `cli.js` still use CommonJS `require/module.exports`
while every other file uses ESM `import/export`. Adding `"type": "module"`
to `package.json` and converting those two files to ESM would make the
whole codebase consistent and eliminate the crash on startup.

**2. Retry on malformed JSON**
If Claude returns invalid JSON despite the system prompt, a retry wrapper
with an error-correction prompt would catch it gracefully:
```javascript
// "Your last response was not valid JSON. Error: [err]. Please try again."
```

**3. Smarter loop termination**
Instead of a fixed attempt cap, track score trajectory. If the score
plateaus across two consecutive iterations — same score, same weakest
section — stop. More rewrites without a different strategy will not help.

**4. Parallel research queries**
Run three different Serper queries in parallel with `Promise.all()`:
```javascript
const [general, examples, stats] = await Promise.all([
  searchWeb(topic),
  searchWeb(topic + " case studies examples"),
  searchWeb(topic + " statistics data 2025"),
]);
```
Richer, more diverse sourcing with no extra latency cost.

**5. Streaming output via SSE**
Use Server-Sent Events to push each agent's progress to the client in
real time rather than waiting for the full pipeline to complete before
returning a response.

**6. Run log persistence**
Save each pipeline run — topic, Agent 1 output, Agent 2 output, every
Agent 3 iteration, final output — to a timestamped JSON file. Essential
for debugging non-deterministic Claude behaviour and for building an
evaluation dataset over time.

**7. Writer schema validation**
Agent 2 currently validates output with a manual `if` check. Adding a
Zod schema (as Agent 1 now has) would enforce the structure consistently
and give clearer error messages when Claude drifts from the required format.