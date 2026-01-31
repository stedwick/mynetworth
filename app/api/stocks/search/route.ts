import { cacheLife } from "next/cache";
import {
  mapYahooSearchQuotesToMatches,
  orderYahooSearchMatches,
  parseSearchQueryParam,
  parseYahooSearchResponse,
} from "./utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YAHOO_SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search";

const getCachedYahooSearchResults = async (query: string) => {
  "use cache";
  cacheLife("days");

  const url = `${YAHOO_SEARCH_URL}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Yahoo search request failed");
  }

  const data = parseYahooSearchResponse(await response.json());
  return orderYahooSearchMatches(
    mapYahooSearchQuotesToMatches(data.quotes ?? []),
    query,
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
