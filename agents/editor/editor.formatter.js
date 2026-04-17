/**
 * formatPostForReview
 * Converts the structured post JSON into a clean, readable text string.
 * Used both for sending to Claude for review and for the final output.
 *
 * @param {object} postJSON
 * @returns {string}
 */
export function formatPostForReview(postJSON) {
  const lines = [];

  lines.push(`# ${postJSON.title || "Untitled"}\n`);
  lines.push(`${postJSON.intro || ""}\n`);

  const sections = Array.isArray(postJSON.sections)
    ? postJSON.sections
    : [];

  for (const section of sections) {
    lines.push(`## ${section.heading || "Section"}\n`);
    lines.push(`${section.content || ""}\n`);
  }

  lines.push(`---\n${postJSON.cta || ""}`);

  return lines.join("\n");
}