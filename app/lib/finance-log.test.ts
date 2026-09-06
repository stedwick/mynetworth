import { expect, it, spyOn } from "bun:test";

import { formatFinanceLog, logFinance } from "./finance-log";

// Stream, console, and environment spies must not affect the parent test runner.
if (process.env.FINANCE_LOG_TEST_CHILD !== "1") {
  it("finance logging passes isolated formatting and stream tests", async () => {
    const child = Bun.spawn([process.execPath, "test", import.meta.path], {
      env: { ...process.env, FINANCE_LOG_TEST_CHILD: "1" },
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    expect(exitCode, `${stdout}\n${stderr}`).toBe(0);
  }, 20_000);
} else {
  const events = [
    ["cache", 35, "CACHE"],
    ["success", 32, "SUCCESS"],
    ["skip", 33, "SKIP"],
    ["error", 31, "FAILURE"],
  ] as const;

  it.each(events)(
    "formats %s with its fixed ANSI color %i",
    (event, color, label) => {
      const message = "Using Ankr API, the price of ETH is $3,000.00 USD.";
      expect(formatFinanceLog(event, message)).toBe(`[${label}] ${message}`);
      expect(formatFinanceLog(event, message, false)).toBe(
        `[${label}] ${message}`,
      );
      expect(formatFinanceLog(event, message, true)).toBe(
        `\u001b[${color}m[${label}]\u001b[0m ${message}`,
      );
    },
  );

  it("replaces every C0, DEL, and C1 control with a space", () => {
    const controls = Array.from({ length: 65 }, (_, index) =>
      String.fromCharCode(index < 32 ? index : index + 95),
    ).join("");
    const message = `Before${controls}after`;
    const sanitized = `Before${" ".repeat(65)}after`;
    expect(formatFinanceLog("error", message)).toBe(`[FAILURE] ${sanitized}`);
    expect(formatFinanceLog("error", message, true)).toBe(
      `\u001b[31m[FAILURE]\u001b[0m ${sanitized}`,
    );
  });

  it.each([
    [undefined, undefined, false, false, false, false],
    [undefined, undefined, true, false, true, false],
    [undefined, undefined, false, true, false, true],
    ["1", undefined, false, false, true, true],
    ["2", undefined, false, false, true, true],
    ["0", undefined, true, true, false, false],
    ["0", undefined, false, false, false, false],
    [undefined, "", true, true, false, false],
    ["1", "", false, false, false, false],
    ["1", "1", true, true, false, false],
  ] as const)(
    "routes writes with FORCE_COLOR=%p NO_COLOR=%p stdoutTTY=%p stderrTTY=%p",
    (force, noColor, stdoutTTY, stderrTTY, stdoutColor, stderrColor) => {
      const oldForce = process.env.FORCE_COLOR;
      const oldNoColor = process.env.NO_COLOR;
      const stdoutDescriptor = Object.getOwnPropertyDescriptor(
        process.stdout,
        "isTTY",
      );
      const stderrDescriptor = Object.getOwnPropertyDescriptor(
        process.stderr,
        "isTTY",
      );
      const stdout = spyOn(process.stdout, "write").mockReturnValue(true);
      const stderr = spyOn(process.stderr, "write").mockReturnValue(true);
      const consoles = (
        ["log", "info", "warn", "error", "debug", "trace"] as const
      ).map((method) => spyOn(console, method).mockImplementation(() => {}));
      try {
        if (force === undefined) delete process.env.FORCE_COLOR;
        else process.env.FORCE_COLOR = force;
        if (noColor === undefined) delete process.env.NO_COLOR;
        else process.env.NO_COLOR = noColor;
        Object.defineProperty(process.stdout, "isTTY", {
          configurable: true,
          value: stdoutTTY,
        });
        Object.defineProperty(process.stderr, "isTTY", {
          configurable: true,
          value: stderrTTY,
        });

        for (const [event] of events) {
          logFinance(event, "First\nsecond\r\tline");
        }
        expect(stdout.mock.calls).toEqual(
          events
            .filter(([event]) => event !== "error")
            .map(([, color, label]) => [
              stdoutColor
                ? `\u001b[${color}m[${label}]\u001b[0m First second  line\n`
                : `[${label}] First second  line\n`,
            ]),
        );
        expect(stderr.mock.calls).toEqual([
          [
            stderrColor
              ? "\u001b[31m[FAILURE]\u001b[0m First second  line\n"
              : "[FAILURE] First second  line\n",
          ],
        ]);
        for (const consoleSpy of consoles) {
          expect(consoleSpy).not.toHaveBeenCalled();
        }
      } finally {
        stdout.mockRestore();
        stderr.mockRestore();
        for (const consoleSpy of consoles) consoleSpy.mockRestore();
        if (stdoutDescriptor) {
          Object.defineProperty(process.stdout, "isTTY", stdoutDescriptor);
        } else Reflect.deleteProperty(process.stdout, "isTTY");
        if (stderrDescriptor) {
          Object.defineProperty(process.stderr, "isTTY", stderrDescriptor);
        } else Reflect.deleteProperty(process.stderr, "isTTY");
        if (oldForce === undefined) delete process.env.FORCE_COLOR;
        else process.env.FORCE_COLOR = oldForce;
        if (oldNoColor === undefined) delete process.env.NO_COLOR;
        else process.env.NO_COLOR = oldNoColor;
      }
    },
  );
}
