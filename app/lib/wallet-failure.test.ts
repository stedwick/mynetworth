import { expect, it } from "bun:test";

import { getWalletFailureReason } from "./wallet-failure";

it("reports controlled wallet failures and hides arbitrary provider details", () => {
  for (const [message, reason] of [
    ["Ankr HTTP request failed (429)", "Ankr HTTP error (429)"],
    ["Ankr RPC request failed (-32602)", "Ankr RPC error (-32602)"],
    ["Ankr RPC request failed", "Ankr RPC error"],
    [
      "Ankr network request failed or timed out",
      "Ankr network failure or timeout",
    ],
    ["Ankr request attempts exhausted", "Ankr retries exhausted"],
    [
      "Invalid Ankr JSON response or response timed out",
      "Invalid Ankr JSON response or response timed out",
    ],
    [
      "Invalid or unsynced Ankr wallet balance",
      "Invalid or unsynced Ankr wallet balance",
    ],
    [
      "Unexpected Ankr wallet pagination; full balance not verified",
      "Unexpected Ankr wallet pagination; full balance not verified",
    ],
    [
      "Incomplete Ankr wallet chain coverage",
      "Incomplete Ankr wallet chain coverage",
    ],
    ["Inconsistent Ankr wallet balance", "Inconsistent Ankr wallet balance"],
    ["Invalid Ankr BTC balance", "Invalid Ankr BTC balance"],
    ["Invalid Ankr SOL balance", "Invalid Ankr SOL balance"],
    ["Invalid SOL price", "Invalid SOL price"],
  ]) {
    expect(getWalletFailureReason(new Error(message))).toBe(reason!);
  }
  const secret = "https://rpc.ankr.com/private-key";
  for (const error of [
    new Error(secret),
    new Error(`Ankr HTTP request failed (503) ${secret}`),
    new Error(`Ankr RPC request failed (-32602)\n${secret}`),
    new Error(`Invalid Ankr SOL balance ${secret}`),
    new Error("Ankr RPC request failed (12345678901234567890)"),
    { message: secret },
    secret,
    null,
  ]) {
    expect(getWalletFailureReason(error)).toBe(
      "Unexpected wallet valuation failure",
    );
  }
});
