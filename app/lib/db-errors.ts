export const isUniqueConstraintViolation = (
  error: unknown,
  constraintName: string,
): boolean => {
  if (!constraintName) return false;
  if (!(error instanceof Error)) return false;
  return error.message.includes(`"${constraintName}"`);
};
