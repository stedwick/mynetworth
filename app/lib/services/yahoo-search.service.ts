import "server-only";

import { cacheLife } from "next/cache";
import { parseYahooSearchResponse } from "@/app/api/stocks/search/utils";

export const getYahooSearchResults = async (query: string) => {
  "use cache";
  cacheLife("days");

  const url = new URL("https://query2.finance.yahoo.com/v1/finance/search");
  url.search = new URLSearchParams({
    q: query,
    quotesCount: "10",
    newsCount: "0",
  }).toString();
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Yahoo search request failed");
  return parseYahooSearchResponse(await response.json()).quotes ?? [];
};
