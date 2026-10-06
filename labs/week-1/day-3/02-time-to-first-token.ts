// Week 1 · Day 3 · Lab part 2
// Compare waiting for the whole answer vs. streaming it.
// Run:  npm run lab labs/week-1/day-3/02-time-to-first-token.ts

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";
const PROMPT = "Write a short story (about 200 words) about a robot learning to cook.";

async function main() {
  // 1) Without streaming: nothing to show until the whole answer is ready.
  let t0 = Date.now();
  const full = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: PROMPT }],
  });
  const waitAll = Date.now() - t0;
  console.log(`WITHOUT streaming: first text after ${waitAll} ms (the full answer, ${full.usage.output_tokens} tokens)\n`);

  // 2) With streaming: text appears as soon as the first piece arrives.
  t0 = Date.now();
  let firstTokenMs: number | null = null;
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: PROMPT }],
  });

  stream.on("text", (delta) => {
    if (firstTokenMs === null) firstTokenMs = Date.now() - t0;
    process.stdout.write(delta);
  });

  // finalMessage() waits for the end and gives you the complete Message,
  // exactly like a non-streaming call (content, stop_reason, usage).
  const message = await stream.finalMessage();
  const total = Date.now() - t0;

  console.log("\n");
  console.log(`WITH streaming:    first text after ${firstTokenMs} ms, finished after ${total} ms`);
  console.log(`stop_reason: ${message.stop_reason} · output_tokens: ${message.usage.output_tokens}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
