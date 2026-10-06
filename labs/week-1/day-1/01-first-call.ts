// Week 1 · Day 1 · Lab part 1
// Send one request to Claude and look at EVERY field of the response.
// Run:  npm run lab labs/week-1/day-1/01-first-call.ts

import Anthropic from "@anthropic-ai/sdk";

// The SDK reads ANTHROPIC_API_KEY from your environment
// (.env or a Codespaces secret in the labs repo, .env.local in the full course project).
const client = new Anthropic();

// Haiku 4.5 is the cheapest current model, so it is good for practice.
const MODEL = "claude-haiku-4-5-20251001";

async function main() {
  const response = await client.messages.create({
    // --- The 3 required fields ---
    model: MODEL,
    max_tokens: 300,
    messages: [{ role: "user", content: "Explain what an API is in two short sentences." }],

    // --- Optional: a system prompt (a top-level field, NOT a message role) ---
    system: "You are a friendly teacher. Use simple English.",
  });

  console.log("id:            ", response.id);
  console.log("type:          ", response.type);
  console.log("role:          ", response.role);
  console.log("model:         ", response.model);
  console.log("stop_reason:   ", response.stop_reason);
  console.log("stop_sequence: ", response.stop_sequence);
  console.log("usage:         ", response.usage);
  console.log("\ncontent blocks:", response.content.length);

  // `content` is a LIST of blocks. Only blocks with type "text" have `.text`.
  for (const block of response.content) {
    if (block.type === "text") {
      console.log(`\n[text block]\n${block.text}`);
    } else {
      console.log(`\n[${block.type} block]`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
