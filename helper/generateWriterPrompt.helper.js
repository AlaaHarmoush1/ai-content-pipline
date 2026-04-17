export const generateWriterPrompt = (facts, sources) => {
  return `
Write a blog post using ONLY the following verified facts and their sources.

VERIFIED FACTS:
${facts.map((f, i) => `[Fact ${i + 1}] ${f}`).join("\n")}

SOURCE URLS:
${sources.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Turn these facts into an engaging, well-structured blog post. Remember: only 
use information from the facts above. Do not add anything not in the list.
  `.trim();
};
