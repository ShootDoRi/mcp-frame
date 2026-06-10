/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const coreMocks = vi.hoisted(() => ({
  createMcpFrameBridge: vi.fn()
}));

vi.mock("@mcp-frame/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mcp-frame/core")>();

  return {
    ...actual,
    createMcpFrameBridge: coreMocks.createMcpFrameBridge
  };
});

import {
  McpFrameProvider,
  useMcpFrame,
  useMcpToolCall,
  useSendMessage,
  useToolInput,
  useToolResult
} from "../src";
import { MCP_FRAME_METHODS } from "@mcp-frame/core";
import type {
  JsonRpcNotification,
  McpFrameBridge,
  McpFrameBridgeListener,
  UiMessageParams
} from "@mcp-frame/core";
import type { PropsWithChildren } from "react";

describe("React hooks", () => {
  beforeEach(() => {
    coreMocks.createMcpFrameBridge.mockReset();
  });

  it("throws a clear error outside McpFrameProvider", () => {
    expect(() => renderHook(() => useMcpFrame())).toThrow(
      "useMcpFrame must be used within McpFrameProvider."
    );
  });

  it("reads the latest tool input inside the provider", () => {
    const bridge = createFakeBridge();
    const wrapper = createWrapper(bridge);
    const { result } = renderHook(
      () => useToolInput<{ userId: string; mode: string }>(),
      { wrapper }
    );

    act(() => {
      bridge.emit({
        jsonrpc: "2.0",
        method: MCP_FRAME_METHODS.toolInput,
        params: {
          userId: "local-user",
          mode: "test"
        }
      });
    });

    expect(result.current).toEqual({
      userId: "local-user",
      mode: "test"
    });
  });

  it("reads the latest tool result inside the provider", () => {
    const bridge = createFakeBridge();
    const wrapper = createWrapper(bridge);
    const { result } = renderHook(
      () =>
        useToolResult<{
          tasks: { id: string; title: string; done: boolean }[];
        }>(),
      { wrapper }
    );

    act(() => {
      bridge.emit({
        jsonrpc: "2.0",
        method: MCP_FRAME_METHODS.toolResult,
        params: {
          structuredContent: {
            tasks: [{ id: "1", title: "Create bridge", done: true }]
          },
          _meta: { source: "test" }
        }
      });
    });

    expect(result.current.structuredContent?.tasks[0]?.title).toBe(
      "Create bridge"
    );
    expect(result.current._meta).toEqual({ source: "test" });
  });

  it("returns validation state without throwing on schema failure", () => {
    const bridge = createFakeBridge();
    const wrapper = createWrapper(bridge);
    const schema = {
      safeParse(value: unknown) {
        if (
          typeof value === "object" &&
          value !== null &&
          "tasks" in value
        ) {
          return {
            success: true as const,
            data: value as { tasks: unknown[] }
          };
        }

        return { success: false as const, error: new Error("Invalid tasks") };
      }
    };

    const { result } = renderHook(() => useToolResult(schema), { wrapper });

    act(() => {
      bridge.emit({
        jsonrpc: "2.0",
        method: MCP_FRAME_METHODS.toolResult,
        params: {
          structuredContent: { nope: true }
        }
      });
    });

    expect(result.current.structuredContent).toBeUndefined();
    expect(result.current.validationError).toBeInstanceOf(Error);
    expect(result.current.result?.structuredContent).toEqual({ nope: true });
  });

  it("exposes sendMessage as a non-waiting call by default", () => {
    const bridge = createFakeBridge();
    const wrapper = createWrapper(bridge);
    const { result } = renderHook(() => useSendMessage(), { wrapper });

    const returnValue = result.current({ content: "hello" });

    expect(returnValue).toBeUndefined();
    expect(bridge.sendMessage).toHaveBeenCalledWith({ content: "hello" });
  });

  it("waits for sendMessage when waitForResponse is true", async () => {
    const bridge = createFakeBridge();
    const wrapper = createWrapper(bridge);
    const { result } = renderHook(() => useSendMessage(), { wrapper });

    const response = result.current(
      { content: "hello" },
      { waitForResponse: true }
    );

    await expect(response).resolves.toEqual({ ok: true });
    expect(bridge.sendMessage).toHaveBeenCalledWith(
      { content: "hello" },
      { waitForResponse: true }
    );
  });

  it("calls bridge.callTool from useMcpToolCall", async () => {
    const bridge = createFakeBridge();
    const wrapper = createWrapper(bridge);
    const { result } = renderHook(() => useMcpToolCall(), { wrapper });

    await expect(result.current("toggle_task", { id: "1" })).resolves.toEqual({
      ok: true
    });

    expect(bridge.callTool).toHaveBeenCalledWith("toggle_task", { id: "1" });
  });

  it("does not destroy an injected bridge on provider unmount", () => {
    const bridge = createFakeBridge();
    const wrapper = createWrapper(bridge);
    const { unmount } = renderHook(() => useMcpFrame(), { wrapper });

    unmount();

    expect(bridge.destroy).not.toHaveBeenCalled();
  });

  it("destroys an owned bridge on provider unmount", () => {
    const bridge = createFakeBridge();
    coreMocks.createMcpFrameBridge.mockReturnValue(bridge);
    const wrapper = createOwnedWrapper();
    const { result, unmount } = renderHook(() => useMcpFrame(), { wrapper });

    expect(result.current.bridge).toBe(bridge);

    unmount();

    expect(bridge.destroy).toHaveBeenCalledTimes(1);
  });
});

interface FakeBridge extends McpFrameBridge {
  emit(message: JsonRpcNotification): void;
}

function createWrapper(bridge: McpFrameBridge) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <McpFrameProvider bridge={bridge}>{children}</McpFrameProvider>;
  };
}

function createOwnedWrapper() {
  return function Wrapper({ children }: PropsWithChildren) {
    return <McpFrameProvider>{children}</McpFrameProvider>;
  };
}

function createFakeBridge(): FakeBridge {
  const listeners = new Set<McpFrameBridgeListener>();

  function sendMessage(message: UiMessageParams): void;
  function sendMessage(
    message: UiMessageParams,
    options: { waitForResponse: true }
  ): Promise<unknown>;
  function sendMessage(
    _message: UiMessageParams,
    options?: { waitForResponse: true }
  ): void | Promise<unknown> {
    if (options?.waitForResponse) {
      return Promise.resolve({ ok: true });
    }
  }
  const sendMessageMock = vi.fn(
    sendMessage
  ) as unknown as McpFrameBridge["sendMessage"];

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    unsubscribe(listener) {
      listeners.delete(listener);
    },
    callTool: vi.fn(() => Promise.resolve({ ok: true })),
    sendMessage: sendMessageMock,
    updateModelContext: vi.fn(() => Promise.resolve({ ok: true })),
    destroy: vi.fn(),
    emit(message) {
      const event = new MessageEvent("message", {
        data: message,
        origin: "https://host.test",
        source: window.parent
      });

      listeners.forEach((listener) => listener(message, event));
    }
  };
}
