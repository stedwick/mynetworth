import { unstable_cache } from "next/cache";
import { getMobulaListedSymbols } from "../price/service";
import {
  filterMobulaSymbols,
  orderMobulaMatches,
  parseSearchQueryParam,
} from "./utils";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 86400;

const getCachedSearchResults = unstable_cache(
  async (query: string, apiKey: string) => {
    const symbols = await getMobulaListedSymbols(apiKey);
    return orderMobulaMatches(
      filterMobulaSymbols(symbols, query, 20),
      query,
    ).map(({ symbol, name }) => ({ symbol, name }));
  },
  ["crypto-search"],
  { revalidate: 86400 },
);

export async function GET(request: Request): Promise<Response> {
  const apiKey = process.env.MOBULA_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Missing MOBULA_API_KEY" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = parseSearchQueryParam(searchParams.get("q"));

  if (!query) {
    return Response.json(
      { error: "Provide a search query via ?q=btc" },
      { status: 400 },
    );
  }

  try {
    const matches = await getCachedSearchResults(query, apiKey);

    return Response.json(matches, {
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=60",
      },
    });
  } catch {
    return Response.json(
      { error: "Mobula search failed" },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
