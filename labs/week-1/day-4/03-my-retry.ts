// Week 1 · Day 4 · Lab part 3
// Write your OWN retry function with exponential backoff and jitter.
// (The SDK already does this. Writing it once helps you understand it, and the exam asks about it.)
// Run:  npm run lab labs/week-1/day-4/03-my-retry.ts

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";

/** Errors that may work if we simply try again later. */
function isRetryable(err: unknown): boolean {
  if (err instanceof Anthropic.APIUserAbortError) return false; // we stopped it ourselves
  if (err instanceof Anthropic.APIConnectionError) return true; // network problem or timeout
  if (err instanceof Anthropic.APIError && typeof err.status === "number") {
    return err.status === 408 || err.status === 409 || err.status === 429 || err.status >= 500;
  }
  return false;
}

/** If the server sent "retry-after" (in seconds), use it. */
function retryAfterMs(err: unknown): number | null {
  if (!(err instanceof Anthropic.APIError)) return null;
  const value = err.headers?.get("retry-after");
  const secs = value ? Number(value) : NaN;
  return Number.isFinite(secs) && secs > 0 ? secs * 1000 : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(call: () => Promise<T>, maxRetries = 4): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call();
    } catch (err) {
      if (!isRetryable(err)) {
        console.log("  not retryable -> give up now");
        throw err;
      }
      if (attempt >= maxRetries) {
        console.log("  no retries left -> give up");
        throw err;
      }
      // Exponential backoff: 0.5s, 1s, 2s, 4s ... (max 8s), with random "jitter".
      const backoff = Math.min(500 * 2 ** attempt, 8000);
      const jittered = backoff * (0.75 + Math.random() * 0.25);
      const wait = retryAfterMs(err) ?? jittered;
      const status = err instanceof Anthropic.APIError ? err.status : "?";
      console.log(`  attempt ${attempt + 1} failed (${status}). Waiting ${Math.round(wait)} ms...`);
      await sleep(wait);
    }
  }
}

/** Simulates a busy server: the first `failures` calls return 529. */
function flakyFetch(failures: number, status = 529): typeof fetch {
  let calls = 0;
  return async (input, init) => {
    calls++;
    if (calls <= failures) {
      return new Response(JSON.stringify({ type: "error", error: { type: "overloaded_error", message: "Simulated" } }), {
        status,
        headers: { "content-type": "application/json" },
      });
    }
    return fetch(input, init);
  };
}

async function main() {
  // maxRetries: 0 turns OFF the SDK's own retries, so only OUR function retries.
  console.log("A) Three 529 errors, then success");
  const a = new Anthropic({ maxRetries: 0, fetch: flakyFetch(3) });
  const message = await withRetry(() =>
    a.messages.create({ model: MODEL, max_tokens: 20, messages: [{ role: "user", content: "Say hi." }] })
  );
  console.log(`  -> success. stop_reason: ${message.stop_reason}\n`);

  console.log("B) A 400 error");
  const b = new Anthropic({ maxRetries: 0, fetch: flakyFetch(1, 400) });
  try {
    await withRetry(() =>
      b.messages.create({ model: MODEL, max_tokens: 20, messages: [{ role: "user", content: "Say hi." }] })
    );
  } catch (err) {
    if (err instanceof Anthropic.APIError) console.log(`  -> ${err.constructor.name} reached our code (status ${err.status})`);
    else throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
