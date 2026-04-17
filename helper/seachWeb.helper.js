import axios from "axios";

/**
 * searchWeb
 * Calls Serper Google Search API and returns raw results
 */

export async function searchWeb(topic) {
  console.log(`\n🌐  Calling Serper API for: "${topic}"`);

  const config = {
    method: "post",
    url: "https://google.serper.dev/search",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    data: {
      q: topic,
    },
  };

  const response = await axios.request(config);

  // ── REQUIRED: Print raw results for verification ─
  console.log("\n─────────────────────────────────────────");
  console.log("📡  RAW SERPER SEARCH RESULTS:");
  console.log("─────────────────────────────────────────");
  console.log(JSON.stringify(response.data, null, 2));
  console.log("─────────────────────────────────────────\n");

  return response.data;
}