import "server-only";

import { parseAnkrRpcResult } from "@/app/api/crypto/ankr-utils";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;

const requestAnkr = async (
  url: string,
  init: RequestInit,
): Promise<unknown> => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) await response.body?.cancel();
    } catch {
      // Fetch errors can contain the credential-bearing URL. Never propagate them.
      throw new Error("Ankr network request failed or timed out");
    }

    if (!response.ok) {
      const retryable =
        response.status === 429 ||
        [500, 502, 503, 504].includes(response.status);
      if (retryable && attempt < MAX_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
        continue;
      }
      throw new Error(`Ankr HTTP request failed (${response.status})`);
    }

    try {
      return await response.json();
    } catch {
      throw new Error("Invalid Ankr JSON response or response timed out");
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
  const payload = await requestAnkr(
    `https://rpc.ankr.com/multichain/${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    },
  );
  return parseAnkrRpcResult(payload);
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
  const payload = await requestAnkr(
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
  );
  return parseAnkrRpcResult(payload);
};
