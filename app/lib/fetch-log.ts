import "server-only";

import { throwRequestError } from "@/app/api/crypto/request-errors";

type ApiResult<T> = {
  value: T;
  summary: string;
};

export const logApiRequest = async <T>(
  name: string,
  url: string,
  init: RequestInit | undefined,
  parse: (data: unknown) => ApiResult<T>,
): Promise<T> => {
  const startedAt = Date.now();
  const response = await fetch(url, init);
  const elapsedMs = Date.now() - startedAt;

  if (!response.ok) {
    console.info(
      `[api] ${name} failed: ${response.status} ${response.statusText} (${elapsedMs}ms)`,
    );
    await throwRequestError(response, name);
  }

  const { value, summary } = parse(await response.json());
  console.info(`[api] ${name}: ${summary} (${elapsedMs}ms)`);

  return value;
};
