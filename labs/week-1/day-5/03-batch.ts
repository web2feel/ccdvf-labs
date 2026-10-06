// Week 1 · Day 5 · Lab part 3
// Send a small Message Batch (50% cheaper), wait for it, and read the results.
//
// Run:            npm run lab labs/week-1/day-5/03-batch.ts
// Check later:    npm run lab labs/week-1/day-5/03-batch.ts msgbatch_...
//
// Most batches finish within an hour, but it can take longer (up to 24 hours).
// This script waits up to 10 minutes. If it is not done, run it again later with the batch ID.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";
const POLL_EVERY_MS = 15_000;
const MAX_WAIT_MS = 10 * 60_000;

const sentences = {
  "greeting": "Good morning, how are you?",
  "thanks": "Thank you very much for your help.",
  "weather": "It is raining today, so take an umbrella.",
};

async function createBatch(): Promise<string> {
  const batch = await client.messages.batches.create({
    requests: Object.entries(sentences).map(([id, text]) => ({
      custom_id: `translate-${id}`, // your own ID, used to match results
      params: {
        model: MODEL,
        max_tokens: 100,
        system: "Translate the user's sentence into French. Reply with the translation only.",
        messages: [{ role: "user", content: text }],
      },
    })),
  });
  console.log(`Created batch ${batch.id} (status: ${batch.processing_status})`);
  console.log(`To check it later: npm run lab labs/week-1/day-5/03-batch.ts ${batch.id}\n`);
  return batch.id;
}

async function waitForBatch(id: string) {
  const start = Date.now();
  while (true) {
    const batch = await client.messages.batches.retrieve(id);
    const c = batch.request_counts;
    console.log(
      `[${Math.round((Date.now() - start) / 1000)}s] ${batch.processing_status} · processing ${c.processing} · succeeded ${c.succeeded} · errored ${c.errored} · expired ${c.expired} · canceled ${c.canceled}`
    );
    if (batch.processing_status === "ended") return true;
    if (Date.now() - start > MAX_WAIT_MS) return false;
    await new Promise((r) => setTimeout(r, POLL_EVERY_MS));
  }
}

async function printResults(id: string) {
  console.log("\nResults (they can come in ANY order, so we use custom_id):");
  for await (const item of await client.messages.batches.results(id)) {
    const r = item.result;
    if (r.type === "succeeded") {
      const text = r.message.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      console.log(`  ${item.custom_id.padEnd(22)} ✓ ${text}   (${r.message.usage.output_tokens} output tokens)`);
    } else if (r.type === "errored") {
      console.log(`  ${item.custom_id.padEnd(22)} ✗ errored: ${r.error.error.type}`);
    } else {
      console.log(`  ${item.custom_id.padEnd(22)} - ${r.type}`); // canceled or expired
    }
  }
}

async function main() {
  const id = process.argv[2] ?? (await createBatch());
  const done = await waitForBatch(id);
  if (done) await printResults(id);
  else console.log(`\nStill processing. Run again later:\nnpm run lab labs/week-1/day-5/03-batch.ts ${id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
