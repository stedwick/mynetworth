import { getYahooSearchResults } from "@/app/lib/services/yahoo-search.service";
import {
  mapYahooSearchQuotesToMatches,
  orderYahooSearchMatches,
  parseSearchQueryParam,
} from "./utils";

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
    const matches = orderYahooSearchMatches(
      mapYahooSearchQuotesToMatches(await getYahooSearchResults(query)),
      query,
    );

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
