import { describe, expect, it } from "bun:test";

import { formatMobulaRequestError } from "./mobula-errors";

describe("formatMobulaRequestError", () => {
  it("includes the Mobula status and response body", () => {
    expect(
      formatMobulaRequestError({
        body: '  {"message":"Invalid blockchain"}  ',
        requestName: "Mobula wallet portfolio request",
        status: 400,
        statusText: "Bad Request",
      }),
    ).toBe(
      'Mobula wallet portfolio request failed (400 Bad Request): {"message":"Invalid blockchain"}',
    );
  });
});
