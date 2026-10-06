// Week 1 · Day 3 · Lab part 3
// The Day 2 chat, now streaming. Press Ctrl+C while Claude is writing to stop the answer.
// Run:  npm run lab labs/week-1/day-3/03-streaming-chat.ts
//
// Commands:  /reset  start a new conversation
//            /exit   quit

import Anthropic from "@anthropic-ai/sdk";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";
const SYSTEM = "You are a friendly study buddy. Use simple English.";

async function main() {
  const rl = readline.createInterface({ input, output });
  let history: Anthropic.MessageParam[] = [];
  // Set while an answer is streaming, so Ctrl+C can stop it.
  let stopCurrent: (() => void) | null = null;

  // Ctrl+C stops the current answer (if one is streaming) instead of quitting.
  rl.on("SIGINT", () => {
    if (stopCurrent) {
      stopCurrent();
    } else {
      rl.close();
      process.exit(0);
    }
  });

  console.log("Streaming chat. Type /reset or /exit. Press Ctrl+C to stop an answer.\n");

  while (true) {
    const userText = (await rl.question("You: ")).trim();
    if (!userText) continue;
    if (userText === "/exit") break;
    if (userText === "/reset") {
      history = [];
      console.log("(history cleared)\n");
      continue;
    }

    history.push({ role: "user", content: userText });
    process.stdout.write("Claude: ");

    const stream = client.messages.stream({ model: MODEL, max_tokens: 1000, system: SYSTEM, messages: history });
    stopCurrent = () => stream.abort();
    stream.on("text", (delta) => process.stdout.write(delta));

    try {
      const message = await stream.finalMessage();
      history.push({ role: "assistant", content: message.content });
      console.log(`\n        [stop_reason: ${message.stop_reason} · output_tokens: ${message.usage.output_tokens}]\n`);
    } catch (err) {
      if (err instanceof Anthropic.APIUserAbortError) {
        // We stopped it ourselves. Keep the partial text so the history stays complete.
        const partial = stream.currentMessage?.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");
        if (partial) history.push({ role: "assistant", content: partial });
        else history.pop(); // nothing was written: remove the unanswered user turn
        console.log("\n        [stopped by you]\n");
      } else {
        history.pop(); // the request failed: remove the unanswered user turn
        console.error("\n[error]", err instanceof Error ? err.message : err, "\n");
      }
    } finally {
      stopCurrent = null;
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
