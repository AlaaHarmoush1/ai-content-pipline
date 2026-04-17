import { callClaude } from "../../utils/claudeClient.js";
import { REWRITE_SYSTEM_PROMPT } from "./editor.prompt.js";

/**
 * rewriteWeakestSection
 * Called ONLY when score < 7.
 * Rewrites the identified weak section and splices it back into the post.
 */
export async function rewriteWeakestSection(postJSON, weakestSection, weaknessReason) {
  // ─────────────────────────────────────────────
  // 1. SAFE GUARD (CRITICAL FIX)
  // ─────────────────────────────────────────────
  const sections = Array.isArray(postJSON.sections)
    ? postJSON.sections
    : [];

  if (sections.length === 0) {
    throw new Error("Invalid postJSON: sections is missing or not an array");
  }

  // ─────────────────────────────────────────────
  // 2. FIND TARGET SECTION SAFELY
  // ─────────────────────────────────────────────
  const sectionIndex = sections.findIndex(
    (s) =>
      s.heading?.toLowerCase?.() === weakestSection?.toLowerCase?.()
  );

  const targetIndex = sectionIndex >= 0 ? sectionIndex : 0;

  const targetSection = sections[targetIndex] || {
    heading: weakestSection || "Section",
    content: "",
  };

  console.log(`\n   ✏️  Rewriting weak section: "${targetSection.heading}"`);
  console.log(`   Reason: ${weaknessReason}\n`);

  // ─────────────────────────────────────────────
  // 3. CLAUDE PROMPT
  // ─────────────────────────────────────────────
  const userMessage = `
The following section of a blog post needs to be rewritten because:
"${weaknessReason}"

SECTION HEADING: "${targetSection.heading}"

CURRENT WEAK CONTENT:
${targetSection.content}

FULL POST CONTEXT:
Title: ${postJSON.title || ""}
Intro: ${postJSON.intro || ""}

Rewrite ONLY the section content.
Return ONLY improved text (no heading, no JSON).
  `.trim();

  const improvedContent = await callClaude(REWRITE_SYSTEM_PROMPT, userMessage);

  // ─────────────────────────────────────────────
  // 4. REBUILD POST SAFELY
  // ─────────────────────────────────────────────
  const updatedSections = [...sections];

  updatedSections[targetIndex] = {
    heading: targetSection.heading,
    content: improvedContent.trim(),
  };

  return {
    ...postJSON,
    sections: updatedSections,
  };
}