"use client";

import { useEffect, useState } from "react";

export type AutocompleteMatch = {
  symbol: string;
  name?: string;
};

export const shouldRunAutocomplete = (
  query: string,
  minChars: number,
): boolean => {
  return query.trim().length >= minChars;
};

const buildAutocompleteUrl = (endpoint: string, query: string): string => {
  return `${endpoint}?q=${encodeURIComponent(query)}`;
};

export const useAutocompleteSearch = ({
  endpoint,
  query,
  minChars = 2,
  debounceMs = 250,
}: {
  endpoint: string | null;
  query: string;
  minChars?: number;
  debounceMs?: number;
}): { matches: AutocompleteMatch[]; loading: boolean } => {
  const [matches, setMatches] = useState<AutocompleteMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!endpoint || !shouldRunAutocomplete(query, minChars)) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await fetch(buildAutocompleteUrl(endpoint, query), {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const data = (await response.json()) as AutocompleteMatch[];
        setMatches(Array.isArray(data) ? data : []);
      } catch (_error) {
        if (!controller.signal.aborted) {
          setMatches([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [endpoint, query, minChars, debounceMs]);

  return { matches, loading };
};
