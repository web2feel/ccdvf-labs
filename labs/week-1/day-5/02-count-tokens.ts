// Week 1 · Day 5 · Lab part 2
// Count tokens BEFORE you send a request, and estimate the cost.
// Run:  npm run lab labs/week-1/day-5/02-count-tokens.ts

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

// Claude Haiku 4.5 prices, in US dollars per million tokens (check the pricing page for today's prices).
const PRICE_INPUT = 1.0;
const PRICE_OUTPUT = 5.0;

const longText = "The Messages API is stateless. ".repeat(200);

const examples: { name: string; params: Anthropic.MessageCountTokensParams }[] = [
  { name: "Short question", params: { model: MODEL, messages: [{ role: "user", content: "Hi!" }] } },
  {
    name: "Same question + system prompt",
    params: { model: MODEL, system: "You are a friendly teacher. Use simple English. Keep answers short.", messages: [{ role: "user", content: "Hi!" }] },
  },
  {
    name: "A 3-turn conversation",
    params: {
      model: MODEL,
      messages: [
        { role: "user", content: "My name is Asha." },
        { role: "assistant", content: "Nice to meet you, Asha!" },
        { role: "user", content: "What is my name?" },
      ],
    },
  },
  { name: "A long document", params: { model: MODEL, messages: [{ role: "user", content: `Summarise this:\n${longText}` }] } },
];

async function main() {
  console.log("Counting tokens (free, nothing is generated):\n");
  for (const ex of examples) {
    const { input_tokens } = await client.messages.countTokens(ex.params);
    const cost = (input_tokens / 1_000_000) * PRICE_INPUT;
    console.log(`${ex.name.padEnd(32)} ${String(input_tokens).padStart(6)} input tokens  ≈ $${cost.toFixed(6)}`);
  }

  // Compare the estimate with a real request.
  const params = examples[1].params;
  const { input_tokens: estimate } = await client.messages.countTokens(params);
  const real = await client.messages.create({ ...params, max_tokens: 50 });
  const total = (real.usage.input_tokens / 1e6) * PRICE_INPUT + (real.usage.output_tokens / 1e6) * PRICE_OUTPUT;
  console.log(`\nEstimate: ${estimate} input tokens. Real request: ${real.usage.input_tokens} input + ${real.usage.output_tokens} output tokens.`);
  console.log(`Real cost of that request ≈ $${total.toFixed(6)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
