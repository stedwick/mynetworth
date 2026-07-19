import { cacheLife } from "next/cache";
import { logApiRequest } from "@/app/lib/fetch-log";
import {
  mapYahooSearchQuotesToMatches,
  orderYahooSearchMatches,
  parseSearchQueryParam,
  parseYahooSearchResponse,
} from "./utils";

const YAHOO_SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search";

const getCachedYahooSearchResults = async (query: string) => {
  "use cache";
  cacheLife("days");

  const url = `${YAHOO_SEARCH_URL}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;

  return logApiRequest(
    "Yahoo search",
    url,
    {
      cache: "no-store",
    },
    (data) => {
      const parsed = parseYahooSearchResponse(data);
      const value = orderYahooSearchMatches(
        mapYahooSearchQuotesToMatches(parsed.quotes ?? []),
        query,
      );
      return { value, summary: `"${query}" → ${value.length} matches` };
    },
  );
};

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = parseSearchQueryParam(searchParams.get("q"));

  if (!query) {
    return Response.json(
      { error: "Provide a search query via ?q=apple" },
      { status: 400 },
    );
  }

  try {
    const matches = await getCachedYahooSearchResults(query);

    return Response.json(matches, {
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=60",
      },
    });
  } catch {
    return Response.json(
      { error: "Yahoo Finance search failed" },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
