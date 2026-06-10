import { describe, expect, it } from "vitest";
import { validateWithSchema } from "../src";

describe("validateWithSchema", () => {
  it("passes through values without a schema", () => {
    expect(validateWithSchema({ ok: true })).toEqual({ data: { ok: true } });
  });

  it("supports safeParse-compatible schemas", () => {
    const schema = {
      safeParse(value: unknown) {
        if (
          typeof value === "object" &&
          value !== null &&
          "ok" in value
        ) {
          return { success: true as const, data: value as { ok: boolean } };
        }

        return { success: false as const, error: new Error("Invalid") };
      }
    };

    expect(validateWithSchema({ ok: true }, schema).data).toEqual({
      ok: true
    });
    expect(validateWithSchema({}, schema).error).toBeInstanceOf(Error);
  });
});
