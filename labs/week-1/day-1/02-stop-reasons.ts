// Week 1 · Day 1 · Lab part 2
// Make Claude stop for three different reasons, and check stop_reason each time.
// Run:  npm run lab labs/week-1/day-1/02-stop-reasons.ts

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

// Join all text blocks into one string.
function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

async function run(name: string, params: Omit<Anthropic.MessageCreateParamsNonStreaming, "model">) {
  const res = await client.messages.create({ model: MODEL, ...params });
  console.log(`\n=== ${name} ===`);
  console.log("stop_reason:  ", res.stop_reason);
  console.log("stop_sequence:", JSON.stringify(res.stop_sequence));
  console.log("output_tokens:", res.usage.output_tokens);
  console.log("text:         ", JSON.stringify(textOf(res)));
  return res;
}

async function main() {
  // 1) A normal answer. Claude finishes by itself -> "end_turn"
  await run("1. end_turn", {
    max_tokens: 200,
    messages: [{ role: "user", content: "Say hello in French. Reply with one word." }],
  });

  // 2) max_tokens is too small. Claude is cut off -> "max_tokens"
  const cut = await run("2. max_tokens", {
    max_tokens: 10,
    messages: [{ role: "user", content: "Write a long story about a cat." }],
  });
  if (cut.stop_reason === "max_tokens") {
    console.log("-> The answer is NOT complete. Raise max_tokens or ask Claude to continue.");
  }

  // 3) Claude writes one of our stop sequences -> "stop_sequence"
  await run("3. stop_sequence", {
    max_tokens: 200,
    stop_sequences: ["5"],
    messages: [{ role: "user", content: "Count from 1 to 10. Put each number on its own line." }],
  });
  console.log("-> The stop sequence itself is not in the text. It is in the stop_sequence field.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
