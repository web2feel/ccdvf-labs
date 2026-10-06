// Week 1 · Day 2 · Lab part 2
// A small chat in the terminal that keeps the conversation history.
// Run:  npm run lab labs/week-1/day-2/02-chat.ts
//
// Commands:  /history  show the messages list
//            /reset    start a new conversation
//            /exit     quit

import Anthropic from "@anthropic-ai/sdk";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";
const SYSTEM = "You are a friendly study buddy. Keep answers short (2-3 sentences).";

// Keep at most this many messages. Older ones are dropped (a "sliding window").
// Try a small number like 4 to see Claude forget early turns.
const MAX_MESSAGES = 20;

/** Keep only the newest messages, and make sure the list still starts with a user turn. */
function trimHistory(history: Anthropic.MessageParam[]): Anthropic.MessageParam[] {
  if (history.length <= MAX_MESSAGES) return history;
  let trimmed = history.slice(-MAX_MESSAGES);
  while (trimmed.length > 0 && trimmed[0].role !== "user") {
    trimmed = trimmed.slice(1);
  }
  return trimmed;
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

async function main() {
  const rl = readline.createInterface({ input, output });
  let history: Anthropic.MessageParam[] = [];
  console.log("Chat with Claude. Type /history, /reset or /exit.\n");

  while (true) {
    const userText = (await rl.question("You: ")).trim();
    if (!userText) continue;
    if (userText === "/exit") break;
    if (userText === "/reset") {
      history = [];
      console.log("(history cleared)\n");
      continue;
    }
    if (userText === "/history") {
      console.log(JSON.stringify(history, null, 2), "\n");
      continue;
    }

    // 1) Add the user's message to the history.
    history.push({ role: "user", content: userText });
    history = trimHistory(history);

    // 2) Send the WHOLE history every time.
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM,
      messages: history,
    });

    // 3) Add Claude's reply to the history. Use response.content (the blocks), not only the text.
    history.push({ role: "assistant", content: response.content });

    console.log(`Claude: ${textOf(response)}`);
    console.log(
      `        [messages: ${history.length} · input_tokens: ${response.usage.input_tokens} · output_tokens: ${response.usage.output_tokens} · stop_reason: ${response.stop_reason}]\n`
    );
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
