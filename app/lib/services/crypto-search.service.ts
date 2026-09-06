import "server-only";

import {
  getCryptoSearchQueries,
  mapYahooCryptoSearchResults,
} from "@/app/api/crypto/search/utils";
import { getYahooSearchResults } from "./yahoo-search.service";

export const searchCryptoAssets = async (query: string) => {
  const results = await Promise.all(
    getCryptoSearchQueries(query).map(getYahooSearchResults),
  );
  return mapYahooCryptoSearchResults(results.flat(), query);
};
