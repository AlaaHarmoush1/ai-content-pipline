export function formatResultsForClaude(rawData) {
  const lines = [];

  if (rawData.answerBox?.answer) {
    lines.push(`ANSWER BOX:\n${rawData.answerBox.answer}\n`);
  }

  if (rawData.knowledgeGraph?.description) {
    lines.push(`KNOWLEDGE GRAPH:\n${rawData.knowledgeGraph.description}\n`);
  }

  if (Array.isArray(rawData.organic)) {
    rawData.organic.forEach((result, i) => {
      lines.push(`--- RESULT ${i + 1} ---`);
      lines.push(`Title  : ${result.title || "N/A"}`);
      lines.push(`URL    : ${result.link || "N/A"}`);
      lines.push(`Snippet: ${result.snippet || "N/A"}`);
      lines.push("");
    });
  }

  return lines.join("\n");
}