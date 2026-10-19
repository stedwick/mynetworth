const safeReasons = new Set([
  "Missing ANKR_API_KEY",
  "Invalid Ankr RPC response",
  "Missing Ankr RPC result",
  "Invalid or unsynced Ankr wallet balance",
  "Unexpected Ankr wallet pagination; full balance not verified",
  "Incomplete Ankr wallet chain coverage",
  "Inconsistent Ankr wallet balance",
  "Invalid Ankr BTC balance",
  "Missing or zero Ankr BTC valuation for a nonzero balance",
  "Invalid Ankr SOL balance",
  "Invalid SOL price",
  "Invalid SOL USD valuation",
  "Invalid Ankr JSON response or response timed out",
]);

export const getWalletFailureReason = (error: unknown): string => {
  // Only emit known application messages or bounded numeric provider codes.
  // Never forward arbitrary errors: they can contain credential-bearing URLs.
  if (error instanceof Error) {
    const message = error.message;
    if (safeReasons.has(message)) return message;
    if (message === "Ankr network request failed or timed out")
      return "Ankr network failure or timeout";
    if (message === "Ankr request attempts exhausted")
      return "Ankr retries exhausted";
    const http = /^Ankr HTTP request failed \(([1-5]\d{2})\)$/.exec(message);
    if (http) return `Ankr HTTP error (${http[1]})`;
    const rpc = /^Ankr RPC request failed(?: \((-?\d{1,10})\))?$/.exec(message);
    if (rpc) return `Ankr RPC error${rpc[1] ? ` (${rpc[1]})` : ""}`;
  }
  return "Unexpected wallet valuation failure";
};
