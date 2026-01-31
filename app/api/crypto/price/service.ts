import { unstable_cache } from "next/cache";
import {
  mapMobulaAllAssetsToSymbols,
  mobulaAllDataSchema,
  parseMobulaMultiData,
} from "./utils";

const MOBULA_ALL_ASSETS_URL = "https://api.mobula.io/api/1/all";
const MOBULA_MULTI_DATA_URL = "https://api.mobula.io/api/1/market/multi-data";

export const getMobulaAssets = unstable_cache(
  async (symbols: string[], apiKey: string) => {
    const url = `${MOBULA_MULTI_DATA_URL}?symbols=${encodeURIComponent(symbols.join(","))}`;
    console.info(
      "[crypto/price] Fetching Mobula prices for:",
      symbols.join(","),
    );

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

export const getMobulaListedSymbols = unstable_cache(
  async (apiKey: string) => {
    const url = `${MOBULA_ALL_ASSETS_URL}?fields=symbol,name,market_cap`;
    console.info("[crypto/price] Fetching Mobula listed symbols");

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Mobula request failed");
    }

    const data = mobulaAllDataSchema.parse(await response.json());
    return mapMobulaAllAssetsToSymbols(data.data);
  },
  ["crypto-listed-symbols"],
  { revalidate: 86400 },
);
