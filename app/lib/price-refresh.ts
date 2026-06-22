import { isSupportedWalletAddress } from "@/app/api/crypto/wallet/utils";
import { compareStringsCaseInsensitive } from "@/app/lib/string-utils";

export const WALLET_REQUEST_INTERVAL_MS = 3_000;

export const normalizeSymbols = (symbols: string[]): string[] => {
  const seen = new Set<string>();

  for (const raw of symbols) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const symbol = trimmed.toUpperCase();
    if (seen.has(symbol)) continue;
    seen.add(symbol);
  }

  return Array.from(seen).sort(compareStringsCaseInsensitive);
};

export const normalizeWalletAddresses = (addresses: string[]): string[] => {
  const seen = new Set<string>();

  for (const raw of addresses) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (!isSupportedWalletAddress(trimmed)) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
  }

  return Array.from(seen).sort(compareStringsCaseInsensitive);
};

export const msUntilNextRequest = (
  previousRequestStart: number,
  now: number,
  intervalMs: number,
): number => Math.max(0, intervalMs - (now - previousRequestStart));

export const chunkList = <T>(items: T[], size: number): T[][] => {
  if (size <= 0) return [];

  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};
