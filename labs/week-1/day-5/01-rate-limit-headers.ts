// Week 1 · Day 5 · Lab part 1
// Read your rate limits from the response headers.
// Run:  npm run lab labs/week-1/day-5/01-rate-limit-headers.ts

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

async function main() {
  // .withResponse() gives you the parsed message AND the raw HTTP response (with headers).
  const { data: message, response, request_id } = await client.messages
    .create({ model: MODEL, max_tokens: 20, messages: [{ role: "user", content: "Say hi." }] })
    .withResponse();

  console.log("answer:     ", message.content[0]?.type === "text" ? message.content[0].text : "");
  console.log("request id: ", request_id);
  console.log("\nRate limit headers:");

  const rows: [string, string][] = [];
  response.headers.forEach((value, name) => {
    if (name.startsWith("anthropic-ratelimit-") || name === "retry-after") rows.push([name, value]);
  });
  rows.sort(([a], [b]) => a.localeCompare(b));
  if (rows.length === 0) console.log("  (none found)");
  for (const [name, value] of rows) console.log(`  ${name.padEnd(48)} ${value}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
