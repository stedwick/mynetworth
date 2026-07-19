const MAX_ERROR_BODY_LENGTH = 500;

export const formatRequestError = ({
  body,
  requestName,
  status,
  statusText,
}: {
  body: string;
  requestName: string;
  status: number;
  statusText: string;
}): string => {
  const trimmedBody = body.trim().slice(0, MAX_ERROR_BODY_LENGTH);
  const statusLabel = statusText ? `${status} ${statusText}` : `${status}`;

  if (!trimmedBody) {
    return `${requestName} failed (${statusLabel})`;
  }

  return `${requestName} failed (${statusLabel}): ${trimmedBody}`;
};

export const throwRequestError = async (
  response: Response,
  requestName: string,
): Promise<never> => {
  throw new Error(
    formatRequestError({
      body: await response.text(),
      requestName,
      status: response.status,
      statusText: response.statusText,
    }),
  );
};
