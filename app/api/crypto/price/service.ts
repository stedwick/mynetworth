import { cacheLife } from "next/cache";
import { logApiRequest } from "@/app/lib/fetch-log";
import {
  mapMobulaAllAssetsToSymbols,
  mobulaAllDataSchema,
  parseMobulaMultiData,
} from "./utils";

const MOBULA_ALL_ASSETS_URL = "https://api.mobula.io/api/1/all";
const MOBULA_MULTI_DATA_URL = "https://api.mobula.io/api/1/market/multi-data";

export const getMobulaAssets = async (symbols: string[], apiKey: string) => {
  "use cache";
  cacheLife("hours");

  const url = `${MOBULA_MULTI_DATA_URL}?symbols=${encodeURIComponent(symbols.join(","))}`;

  return logApiRequest(
    "Mobula prices",
    url,
    {
      headers: {
        Authorization: apiKey,
      },
      cache: "no-store",
    },
    (data) => {
      const value = parseMobulaMultiData(data);
      return {
        value,
        summary: `${symbols.join(",")} → ${value.dataArray?.length ?? 0} assets`,
      };
    },
  );
};

export const getMobulaListedSymbols = async (apiKey: string) => {
  "use cache";
  cacheLife("days");

  const url = `${MOBULA_ALL_ASSETS_URL}?fields=symbol,name,market_cap`;

  return logApiRequest(
    "Mobula listed symbols",
    url,
    {
      headers: {
        Authorization: apiKey,
      },
      cache: "no-store",
    },
    (data) => {
      const value = mapMobulaAllAssetsToSymbols(
        mobulaAllDataSchema.parse(data).data,
      );
      return { value, summary: `${value.length} symbols` };
    },
  );
};
