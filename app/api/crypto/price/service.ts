import { unstable_cache } from "next/cache";
import { parseMobulaMultiData } from "./utils";

const MOBULA_MULTI_DATA_URL = "https://api.mobula.io/api/1/market/multi-data";

export const getMobulaAssets = unstable_cache(
  async (symbols: string[], apiKey: string) => {
    const url = `${MOBULA_MULTI_DATA_URL}?symbols=${encodeURIComponent(symbols.join(","))}`;
    console.info("[crypto/price] Fetching Mobula prices for:", symbols.join(","));

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Mobula request failed");
    }

    return parseMobulaMultiData(await response.json());
  },
  ["crypto-price"],
  { revalidate: 3600 },
);
