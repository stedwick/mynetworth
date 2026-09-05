import {
  isEthAddress,
  isSupportedWalletAddress,
} from "@/app/api/crypto/wallet/utils";
import { compareStringsCaseInsensitive } from "@/app/lib/string-utils";

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
    const address = isEthAddress(trimmed) ? trimmed.toLowerCase() : trimmed;
    if (seen.has(address)) continue;
    seen.add(address);
  }

  return Array.from(seen).sort(compareStringsCaseInsensitive);
};

export const collectRefreshPrices = async (
  keys: string[],
  fetchPrice: (key: string) => Promise<number>,
): Promise<{ prices: Record<string, number>; failed: string[] }> => {
  const prices: Record<string, number> = {};
  const failed: string[] = [];
  const uniqueKeys = [...new Set(keys)];
  for (const batch of chunkList(uniqueKeys, 4)) {
    const results = await Promise.allSettled(
      batch.map(async (key) => {
        const price = await fetchPrice(key);
        if (
          !Number.isFinite(price) ||
          price < 0 ||
          !Number.isSafeInteger(Math.round(price * 100))
        ) {
          throw new Error("Invalid refresh valuation");
        }
        return price;
      }),
    );
    results.forEach((result, index) => {
      if (result.status === "fulfilled") prices[batch[index]] = result.value;
      else failed.push(batch[index]);
    });
  }
  return { prices, failed };
};

export const chunkList = <T>(items: T[], size: number): T[][] => {
  if (size <= 0) return [];

  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};
