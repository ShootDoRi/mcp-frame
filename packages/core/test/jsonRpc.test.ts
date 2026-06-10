import { describe, expect, it } from "vitest";
import {
  createJsonRpcNotification,
  createJsonRpcRequest,
  isJsonRpcMessage,
  isJsonRpcNotification,
  isJsonRpcRequest,
  isJsonRpcResponse
} from "../src";

describe("jsonRpc helpers", () => {
  it("creates JSON-RPC requests with ids", () => {
    const request = createJsonRpcRequest("tools/call", {
      name: "toggle_task"
    });

    expect(request.jsonrpc).toBe("2.0");
    expect(request.method).toBe("tools/call");
    expect(typeof request.id).toBe("string");
    expect(isJsonRpcRequest(request)).toBe(true);
    expect(isJsonRpcMessage(request)).toBe(true);
  });

  it("creates JSON-RPC notifications without ids", () => {
    const notification = createJsonRpcNotification("ui/message", {
      content: "hello"
    });

    expect(notification).toEqual({
      jsonrpc: "2.0",
      method: "ui/message",
      params: { content: "hello" }
    });
    expect(isJsonRpcNotification(notification)).toBe(true);
    expect(isJsonRpcMessage(notification)).toBe(true);
  });

  it("detects JSON-RPC responses", () => {
    expect(
      isJsonRpcResponse({ jsonrpc: "2.0", id: "1", result: { ok: true } })
    ).toBe(true);
    expect(
      isJsonRpcResponse({
        jsonrpc: "2.0",
        id: "1",
        error: { code: -32000, message: "Nope" }
      })
    ).toBe(true);
  });

  it("ignores invalid messages", () => {
    expect(isJsonRpcMessage(null)).toBe(false);
    expect(isJsonRpcMessage({ jsonrpc: "1.0", method: "x" })).toBe(false);
    expect(isJsonRpcMessage({ jsonrpc: "2.0" })).toBe(false);
  });
});
