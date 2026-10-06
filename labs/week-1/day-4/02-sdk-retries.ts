// Week 1 · Day 4 · Lab part 2
// Watch the SDK retry for you. We SIMULATE server problems with a fake "fetch",
// so you can see retries without waiting for a real outage.
// Run:  npm run lab labs/week-1/day-4/02-sdk-retries.ts

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";
const request = { model: MODEL, max_tokens: 20, messages: [{ role: "user" as const, content: "Say hi." }] };

let start = Date.now();
const seconds = () => ((Date.now() - start) / 1000).toFixed(1) + "s";

/** A fetch that fails the first `failures` calls with the given status, then calls the real API. */
function flakyFetch(failures: number, status: number, errorType: string, retryAfter?: string): typeof fetch {
  let calls = 0;
  return async (input, init) => {
    calls++;
    if (calls <= failures) {
      console.log(`  [${seconds()}] attempt ${calls}: simulated ${status} ${errorType}`);
      const headers: Record<string, string> = { "content-type": "application/json", "request-id": `req_simulated_${calls}` };
      if (retryAfter) headers["retry-after"] = retryAfter;
      return new Response(JSON.stringify({ type: "error", error: { type: errorType, message: "Simulated error" } }), {
        status,
        headers,
      });
    }
    console.log(`  [${seconds()}] attempt ${calls}: sent to the real API`);
    return fetch(input, init);
  };
}

async function main() {
  // A) Two 529 "overloaded" errors. The SDK retries twice by default, so the 3rd attempt works.
  console.log("A) Two 529 errors, default settings (maxRetries: 2)");
  start = Date.now();
  const a = new Anthropic({ fetch: flakyFetch(2, 529, "overloaded_error") });
  const ok = await a.messages.create(request);
  console.log(`  -> success after retries. stop_reason: ${ok.stop_reason}\n`);

  // B) The same problem with retries turned off. The error reaches your code at once.
  console.log("B) Same errors, but maxRetries: 0");
  start = Date.now();
  const b = new Anthropic({ fetch: flakyFetch(2, 529, "overloaded_error"), maxRetries: 0 });
  try {
    await b.messages.create(request);
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.log(`  -> ${err.constructor.name}: status ${err.status}, request id ${err.requestID}\n`);
    } else throw err;
  }

  // C) A 429 with "retry-after: 3". The SDK waits about 3 seconds, as the server asked.
  console.log("C) One 429 with retry-after: 3");
  start = Date.now();
  const c = new Anthropic({ fetch: flakyFetch(1, 429, "rate_limit_error", "3") });
  await c.messages.create(request);
  console.log(`  -> success. Look at the time gap between attempt 1 and 2.\n`);

  // D) A 400 is NOT retried, even with retries turned on.
  console.log("D) One 400 invalid_request_error (maxRetries: 2)");
  start = Date.now();
  const d = new Anthropic({ fetch: flakyFetch(1, 400, "invalid_request_error") });
  try {
    await d.messages.create(request);
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.log(`  -> ${err.constructor.name}: no retry. A bad request will fail again, so fix it instead.`);
    } else throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
