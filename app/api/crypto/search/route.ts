import { searchCryptoAssets } from "@/app/lib/services/crypto-search.service";
import { parseSearchQueryParam } from "./utils";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = parseSearchQueryParam(searchParams.get("q"));
  if (!query) {
    return Response.json(
      { error: "Provide a search query via ?q=btc" },
      { status: 400 },
    );
  }
  try {
    return Response.json(await searchCryptoAssets(query), {
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=60",
      },
    });
  } catch {
    return Response.json(
      { error: "Yahoo Finance crypto search failed" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
