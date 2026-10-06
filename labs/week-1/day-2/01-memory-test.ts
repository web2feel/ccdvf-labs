// Week 1 · Day 2 · Lab part 1
// Prove that the API is stateless: Claude only "remembers" what you send again.
// Run:  npm run lab labs/week-1/day-2/01-memory-test.ts

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

async function ask(name: string, messages: Anthropic.MessageParam[]) {
  const res = await client.messages.create({ model: MODEL, max_tokens: 100, messages });
  console.log(`\n=== ${name} ===`);
  console.log("messages sent:", messages.length);
  console.log("input_tokens: ", res.usage.input_tokens);
  console.log("answer:       ", textOf(res));
  return res;
}

async function main() {
  // Request 1: tell Claude your name.
  const first = await ask("1. Tell Claude a fact", [
    { role: "user", content: "Hi! My name is Asha and my favourite colour is green. Reply in one short sentence." },
  ]);

  // Request 2: a NEW request with only the new question. No history.
  await ask("2. Ask again WITHOUT history", [
    { role: "user", content: "What is my name? Reply in one short sentence." },
  ]);
  console.log("-> Claude does not know. The API is stateless: each request starts from zero.");

  // Request 3: the same question, but we send the whole conversation again.
  await ask("3. Ask again WITH history", [
    { role: "user", content: "Hi! My name is Asha and my favourite colour is green. Reply in one short sentence." },
    { role: "assistant", content: first.content }, // Claude's real reply, as content blocks
    { role: "user", content: "What is my name? Reply in one short sentence." },
  ]);
  console.log("-> Now Claude knows, because we sent the earlier turns again.");

  // Request 4: a SYNTHETIC history. We wrote the assistant turn ourselves.
  await ask("4. Synthetic history (we wrote the assistant turn)", [
    { role: "user", content: "My favourite fruit is mango." },
    { role: "assistant", content: "Mango is a great choice! I will remember that." },
    { role: "user", content: "What is my favourite fruit? Reply in one short sentence." },
  ]);
  console.log("-> Claude trusts the history you send, even if it never said those words.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
