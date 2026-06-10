import { describe, expect, it } from "vitest";
import {
  MCP_FRAME_METHODS,
  isToolInputNotification,
  isToolResultNotification
} from "../src";

describe("message guards", () => {
  it("detects tool input notifications", () => {
    expect(
      isToolInputNotification({
        jsonrpc: "2.0",
        method: MCP_FRAME_METHODS.toolInput,
        params: { query: "todos" }
      })
    ).toBe(true);
  });

  it("detects tool result notifications and preserves the envelope", () => {
    const value = {
      jsonrpc: "2.0",
      method: MCP_FRAME_METHODS.toolResult,
      params: {
        content: [{ type: "text", text: "Done" }],
        structuredContent: { tasks: [] },
        _meta: { traceId: "abc" }
      }
    };

    expect(isToolResultNotification(value)).toBe(true);
  });

  it("rejects malformed tool result payloads", () => {
    expect(
      isToolResultNotification({
        jsonrpc: "2.0",
        method: MCP_FRAME_METHODS.toolResult,
        params: { content: "not-an-array" }
      })
    ).toBe(false);
  });
});
