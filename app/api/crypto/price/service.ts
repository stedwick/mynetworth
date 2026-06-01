import { throwMobulaRequestError } from "@/app/api/crypto/mobula-errors";
import {
  mapMobulaAllAssetsToSymbols,
  mobulaAllDataSchema,
  parseMobulaMultiData,
} from "./utils";

const MOBULA_ALL_ASSETS_URL = "https://api.mobula.io/api/1/all";
const MOBULA_MULTI_DATA_URL = "https://api.mobula.io/api/1/market/multi-data";

export const getMobulaAssets = async (symbols: string[], apiKey: string) => {
  const url = `${MOBULA_MULTI_DATA_URL}?symbols=${encodeURIComponent(symbols.join(","))}`;
  console.info("[crypto/price] Fetching Mobula prices for:", symbols.join(","));

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    await throwMobulaRequestError(response, "Mobula price request");
  }

  return parseMobulaMultiData(await response.json());
};

export const getMobulaListedSymbols = async (apiKey: string) => {
  const url = `${MOBULA_ALL_ASSETS_URL}?fields=symbol,name,market_cap`;
  console.info("[crypto/price] Fetching Mobula listed symbols");

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    await throwMobulaRequestError(response, "Mobula symbols request");
  }

  const data = mobulaAllDataSchema.parse(await response.json());
  return mapMobulaAllAssetsToSymbols(data.data);
};
