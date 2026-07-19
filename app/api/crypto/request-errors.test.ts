import { describe, expect, it } from "bun:test";

import { formatRequestError } from "./request-errors";

describe("formatRequestError", () => {
  it("includes the status and response body", () => {
    expect(
      formatRequestError({
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
