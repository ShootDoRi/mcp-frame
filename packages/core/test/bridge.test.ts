/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MCP_FRAME_METHODS,
  McpFrameBridgeDestroyedError,
  McpFrameBridgeJsonRpcError,
  McpFrameBridgeTimeoutError,
  createJsonRpcNotification,
  createMcpFrameBridge
} from "../src";
import type { JsonRpcRequest } from "../src";

const originalPostMessage = window.parent.postMessage;

afterEach(() => {
  window.parent.postMessage = originalPostMessage;
  vi.restoreAllMocks();
});

describe("createMcpFrameBridge", () => {
  it("does not notify subscribers for invalid messages", () => {
    const bridge = createMcpFrameBridge({ allowedOrigins: ["https://host.test"] });
    const listener = vi.fn();

    bridge.subscribe(listener);
    dispatchHostMessage({ nope: true });

    expect(listener).not.toHaveBeenCalled();
    bridge.destroy();
  });

  it("ignores messages from origins that are not allowed", () => {
    const bridge = createMcpFrameBridge({ allowedOrigins: ["https://host.test"] });
    const listener = vi.fn();

    bridge.subscribe(listener);
    dispatchHostMessage(
      createJsonRpcNotification(MCP_FRAME_METHODS.toolInput, { ok: true }),
      "https://evil.test"
    );

    expect(listener).not.toHaveBeenCalled();
    bridge.destroy();
  });

  it("ignores messages not sent by the parent frame", () => {
    const bridge = createMcpFrameBridge();
    const listener = vi.fn();

    bridge.subscribe(listener);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: createJsonRpcNotification(MCP_FRAME_METHODS.toolInput, {
          ok: true
        }),
        origin: "https://host.test",
        source: null
      })
    );

    expect(listener).not.toHaveBeenCalled();
    bridge.destroy();
  });

  it("notifies subscribers for valid parent messages", () => {
    const bridge = createMcpFrameBridge({ allowedOrigins: ["https://host.test"] });
    const listener = vi.fn();
    const notification = createJsonRpcNotification(MCP_FRAME_METHODS.toolInput, {
      ok: true
    });

    bridge.subscribe(listener);
    dispatchHostMessage(notification);

    expect(listener).toHaveBeenCalledWith(
      notification,
      expect.objectContaining({ origin: "https://host.test" })
    );
    bridge.destroy();
  });

  it("sends ui/message as a notification by default", () => {
    const posted: unknown[] = [];
    window.parent.postMessage = vi.fn((message: unknown) => {
      posted.push(message);
    }) as typeof window.parent.postMessage;
    const bridge = createMcpFrameBridge();

    const result = bridge.sendMessage({ content: "hello" });

    expect(result).toBeUndefined();
    expect(posted).toEqual([
      {
        jsonrpc: "2.0",
        method: MCP_FRAME_METHODS.message,
        params: { content: "hello" }
      }
    ]);
    bridge.destroy();
  });

  it("resolves matching request responses", async () => {
    let request: JsonRpcRequest | undefined;
    window.parent.postMessage = vi.fn((message: unknown) => {
      request = message as JsonRpcRequest;
    }) as typeof window.parent.postMessage;
    const bridge = createMcpFrameBridge();

    const promise = bridge.callTool("toggle_task", { id: "1" });
    expect(request?.method).toBe(MCP_FRAME_METHODS.toolCall);
    dispatchHostMessage({
      jsonrpc: "2.0",
      id: request?.id,
      result: { ok: true }
    });

    await expect(promise).resolves.toEqual({ ok: true });
    bridge.destroy();
  });

  it("rejects JSON-RPC errors", async () => {
    let request: JsonRpcRequest | undefined;
    window.parent.postMessage = vi.fn((message: unknown) => {
      request = message as JsonRpcRequest;
    }) as typeof window.parent.postMessage;
    const bridge = createMcpFrameBridge();

    const promise = bridge.updateModelContext({ selectedTask: "1" });
    dispatchHostMessage({
      jsonrpc: "2.0",
      id: request?.id,
      error: { code: -32000, message: "Tool failed" }
    });

    await expect(promise).rejects.toBeInstanceOf(McpFrameBridgeJsonRpcError);
    bridge.destroy();
  });

  it("rejects timed-out requests", async () => {
    vi.useFakeTimers();
    const bridge = createMcpFrameBridge({ requestTimeoutMs: 25 });
    window.parent.postMessage = vi.fn() as typeof window.parent.postMessage;

    const promise = bridge.callTool("slow");
    vi.advanceTimersByTime(25);

    await expect(promise).rejects.toBeInstanceOf(McpFrameBridgeTimeoutError);
    bridge.destroy();
    vi.useRealTimers();
  });

  it("rejects pending requests on destroy", async () => {
    window.parent.postMessage = vi.fn() as typeof window.parent.postMessage;
    const bridge = createMcpFrameBridge();
    const promise = bridge.callTool("never");

    bridge.destroy();

    await expect(promise).rejects.toBeInstanceOf(McpFrameBridgeDestroyedError);
  });
});

function dispatchHostMessage(
  data: unknown,
  origin = "https://host.test"
): void {
  window.dispatchEvent(
    new MessageEvent("message", {
      data,
      origin,
      source: window.parent
    })
  );
}
