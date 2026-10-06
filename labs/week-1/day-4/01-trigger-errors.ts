// Week 1 · Day 4 · Lab part 1
// Make three different errors on purpose, and look at what the SDK gives you.
// Run:  npm run lab labs/week-1/day-4/01-trigger-errors.ts

import Anthropic, { APIError } from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";

// maxRetries: 0 so each error shows up at once (these errors are not retried anyway).
const client = new Anthropic({ maxRetries: 0 });
const badKeyClient = new Anthropic({ apiKey: "sk-ant-this-key-is-not-real", maxRetries: 0 });

/** Reads the error type from the JSON body: { type: "error", error: { type, message } } */
function errorType(err: APIError): string {
  const body = err.error as { error?: { type?: string } } | undefined;
  return body?.error?.type ?? "(none)";
}

// The SDK adds a hidden `_request_id` to every successful response.
async function tryIt(name: string, call: () => Promise<Anthropic.Message & { _request_id?: string | null }>) {
  console.log(`\n=== ${name} ===`);
  try {
    const message = await call();
    console.log("success! request id:", message._request_id);
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.log("SDK class:  ", err.constructor.name);
      console.log("HTTP status:", err.status);
      console.log("error type: ", errorType(err));
      console.log("message:    ", err.message);
      console.log("request id: ", err.requestID);
    } else {
      throw err;
    }
  }
}

async function main() {
  // 400: an empty messages list is not a valid request.
  await tryIt("1. Bad request (400)", () =>
    client.messages.create({ model: MODEL, max_tokens: 50, messages: [] })
  );

  // 401: the API key is wrong.
  await tryIt("2. Wrong API key (401)", () =>
    badKeyClient.messages.create({ model: MODEL, max_tokens: 50, messages: [{ role: "user", content: "Hi" }] })
  );

  // 404: this model does not exist.
  await tryIt("3. Unknown model (404)", () =>
    client.messages.create({ model: "claude-made-up-model", max_tokens: 50, messages: [{ role: "user", content: "Hi" }] })
  );

  // A good request, for comparison.
  await tryIt("4. A good request", () =>
    client.messages.create({ model: MODEL, max_tokens: 20, messages: [{ role: "user", content: "Say hi." }] })
  );

  console.log("\nNone of errors 1-3 should be retried: the request itself must be fixed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
