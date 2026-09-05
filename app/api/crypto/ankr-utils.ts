import { z } from "zod";

export const usdAmountSchema = z
  .union([
    z.number(),
    z
      .string()
      .regex(/^\d+(?:\.\d+)?$/)
      .refine((value) => Number(value) !== 0 || !/[1-9]/.test(value)),
  ])
  .transform(Number)
  .pipe(z.number().nonnegative());

const rpcResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.literal(1),
  error: z.unknown().optional(),
  result: z.unknown().optional(),
});

export const parseAnkrRpcResult = (payload: unknown): unknown => {
  const parsed = rpcResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid Ankr RPC response");

  const { error, result } = parsed.data;
  if (error !== undefined && error !== null) {
    const parsedError = z.object({ code: z.number().int() }).safeParse(error);
    const code = parsedError.success ? ` (${parsedError.data.code})` : "";
    throw new Error(`Ankr RPC request failed${code}`);
  }
  if (result === undefined || result === null) {
    throw new Error("Missing Ankr RPC result");
  }
  return result;
};
