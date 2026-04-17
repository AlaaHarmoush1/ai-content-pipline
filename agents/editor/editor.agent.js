import { scorePost } from "./editor.scorer.js";
import { rewriteWeakestSection } from "./editor.rewriter.js";
import { formatPostForReview } from "./editor.formatter.js";

/**
 * editorAgent
 * Orchestrates the full review + rewrite loop.
 *
 * Flow:
 * 1. Score post
 * 2. If score < threshold → rewrite weakest section
 * 3. Repeat until score >= threshold or max attempts reached
 */
export async function editorAgent(postJSON) {
  const MAX_ATTEMPTS = 3;
  const TARGET_SCORE = 7;

  let currentPost = postJSON;
  let attempt = 0;
  let score = 0;

  const editNotes = [];

  while (attempt < MAX_ATTEMPTS) {
    attempt++;

    // ─────────────────────────────────────────────
    // 1. SCORE CURRENT VERSION
    // ─────────────────────────────────────────────
    const evaluation = await scorePost(currentPost);

    score = evaluation.score;

    console.log(`\n📊 Attempt ${attempt} → Score: ${score}/10`);
    console.log(`🧠 Feedback: ${evaluation.overall_feedback}`);

    // ─────────────────────────────────────────────
    // 2. EXIT CONDITION (GOOD ENOUGH)
    // ─────────────────────────────────────────────
    if (score >= TARGET_SCORE) {
      console.log(`\n✅ Quality threshold reached. Exiting editor loop.`);
      break;
    }

    // ─────────────────────────────────────────────
    // 3. REWRITE WEAKEST SECTION
    // ─────────────────────────────────────────────
    console.log(`\n⚠️ Score too low. Rewriting weakest section...`);

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

  // ─────────────────────────────────────────────
  // 4. FINAL OUTPUT
  // ─────────────────────────────────────────────
  const finalScore =
    attempt === MAX_ATTEMPTS && score < TARGET_SCORE
      ? `Max attempts reached (${MAX_ATTEMPTS})`
      : `Passed threshold after ${attempt} attempt(s)`;

  return {
    score,
    final_post: formatPostForReview(currentPost),
    edit_notes: editNotes.length
      ? `${finalScore} | ${editNotes.join(" | ")}`
      : `${finalScore} | No edits needed`,
  };
}