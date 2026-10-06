// Week 1 · Day 3 · Lab part 1
// Turn on streaming and print every event that arrives, in order.
// Run:  npm run lab labs/week-1/day-3/01-raw-events.ts

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

async function main() {
  // stream: true -> the SDK gives us the raw server-sent events, one by one.
  const stream = await client.messages.create({
    model: MODEL,
    max_tokens: 100,
    stream: true,
    messages: [{ role: "user", content: "Say hello in three languages, one per line." }],
  });

  let deltas = 0;
  for await (const event of stream) {
    switch (event.type) {
      case "message_start":
        console.log(`message_start        id=${event.message.id} input_tokens=${event.message.usage.input_tokens}`);
        break;
      case "content_block_start":
        console.log(`content_block_start  index=${event.index} type=${event.content_block.type}`);
        break;
      case "content_block_delta":
        deltas++;
        if (event.delta.type === "text_delta") {
          console.log(`content_block_delta  text=${JSON.stringify(event.delta.text)}`);
        } else {
          console.log(`content_block_delta  ${event.delta.type}`);
        }
        break;
      case "content_block_stop":
        console.log(`content_block_stop   index=${event.index}`);
        break;
      case "message_delta":
        console.log(`message_delta        stop_reason=${event.delta.stop_reason} output_tokens=${event.usage.output_tokens}`);
        break;
      case "message_stop":
        console.log("message_stop");
        break;
    }
  }
  console.log(`\n${deltas} text pieces arrived. Joined together, they are the full answer.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
