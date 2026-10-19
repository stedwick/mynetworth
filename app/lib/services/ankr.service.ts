import "server-only";

import { parseAnkrRpcResult } from "@/app/api/crypto/ankr-utils";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;

const requestAnkr = async (
  url: string,
  init: RequestInit,
  parse: (payload: unknown) => unknown = (payload) => payload,
): Promise<unknown> => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, 250 * 2 ** (attempt - 1)),
      );
    }
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        cache: "no-store",
        redirect: "error",
        signal,
      });
      if (!response.ok) await response.body?.cancel();
    } catch {
      // Fetch errors can contain the credential-bearing URL. Never propagate them.
      if (attempt < MAX_ATTEMPTS - 1) continue;
      throw new Error("Ankr network request failed or timed out");
    }

    if (!response.ok) {
      const retryable =
        response.status === 429 ||
        [500, 502, 503, 504].includes(response.status);
      if (retryable && attempt < MAX_ATTEMPTS - 1) {
        continue;
      }
      throw new Error(`Ankr HTTP request failed (${response.status})`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      if (signal.aborted && attempt < MAX_ATTEMPTS - 1) continue;
      throw new Error("Invalid Ankr JSON response or response timed out");
    }
    try {
      return parse(payload);
    } catch (error) {
      // RPC failures can arrive over HTTP 200. Share the HTTP retry budget.
      if (
        error instanceof Error &&
        error.message === "Ankr RPC request failed (-32603)" &&
        attempt < MAX_ATTEMPTS - 1
      )
        continue;
      throw error;
    }
  }
  throw new Error("Ankr request attempts exhausted");
};

export const requestAnkrRpc = async (
  apiKey: string,
  method: "ankr_getAccountBalance" | "ankr_getTokenPrice",
  params: Record<string, unknown>,
): Promise<unknown> => {
  if (!apiKey.trim()) throw new Error("Missing ANKR_API_KEY");
  return requestAnkr(
    `https://rpc.ankr.com/multichain/${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    },
    parseAnkrRpcResult,
  );
};

export const requestAnkrBtc = async (
  apiKey: string,
  path: string,
): Promise<unknown> => {
  if (!apiKey.trim()) throw new Error("Missing ANKR_API_KEY");
  return requestAnkr(
    `https://rpc.ankr.com/premium-http/btc_blockbook/${encodeURIComponent(apiKey)}/api/v2/${path}`,
    { method: "GET" },
  );
};

export const requestAnkrSolBalance = async (
  apiKey: string,
  address: string,
): Promise<unknown> => {
  if (!apiKey.trim()) throw new Error("Missing ANKR_API_KEY");
  return requestAnkr(
    `https://rpc.ankr.com/solana/${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address, { commitment: "finalized" }],
      }),
    },
    parseAnkrRpcResult,
  );
};
