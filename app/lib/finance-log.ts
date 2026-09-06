const eventColors = {
  cache: 35,
  success: 32,
  skip: 33,
  error: 31,
} as const;

type LogEvent = keyof typeof eventColors;

export const formatFinanceLog = (
  event: LogEvent,
  message: string,
  color = false,
): string => {
  const line = message.replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, " ");
  const prefix = `[${event === "error" ? "FAILURE" : event.toUpperCase()}]`;
  return color
    ? `\u001b[${eventColors[event]}m${prefix}\u001b[0m ${line}`
    : `${prefix} ${line}`;
};

export const logFinance = (event: LogEvent, message: string): void => {
  const stream = event === "error" ? process.stderr : process.stdout;
  const forced = process.env.FORCE_COLOR;
  const color =
    process.env.NO_COLOR === undefined &&
    (forced !== undefined ? forced !== "0" : Boolean(stream.isTTY));
  // Next replays console calls captured by "use cache". Stream writes describe
  // actual execution, so a cache hit cannot replay an old network-request message.
  // Wallet identifiers must be abbreviated. Never log credentials, URLs, or bodies.
  stream.write(`${formatFinanceLog(event, message, color)}\n`);
};
