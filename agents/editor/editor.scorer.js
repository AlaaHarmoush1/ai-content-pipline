import { formatPostForReview } from "./editor.formatter.js";
import { callClaudeJSON } from "../../utils/claudeClient.js";
import { SCORING_SYSTEM_PROMPT } from "./editor.prompt.js";

/**
 * scorePost
 * Calls Claude to evaluate the draft and return a structured score.
 *
 * @param {object} postJSON - The blog post from Agent 2
 * @returns {{ score, weakest_section, weakness_reason, overall_feedback }}
 */
export async function scorePost(postJSON) {
  const postText = formatPostForReview(postJSON);

  const userMessage = `
Please evaluate this blog post draft:

${postText}

Return your evaluation as JSON.
  `.trim();

  return await callClaudeJSON(SCORING_SYSTEM_PROMPT, userMessage);
}