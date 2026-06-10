import {
  MCP_FRAME_METHODS,
  createJsonRpcNotification,
  isJsonRpcMessage,
  isJsonRpcRequest
} from "@mcp-frame/core";
import type {
  JsonRpcMessage,
  JsonRpcNotification,
  JsonRpcRequest,
  ToolResultPayload
} from "@mcp-frame/core";

export type MockMcpHostMessage = JsonRpcRequest | JsonRpcNotification;

export interface MockMcpHostOptions {
  window?: Window;
  origin?: string;
  autoRespond?: boolean;
  defaultResponse?: unknown;
}

export interface MockMcpHost {
  sendToolInput(params: unknown): void;
  sendToolResult(params: ToolResultPayload): void;
  getRequests(): MockMcpHostMessage[];
  clearRequests(): void;
  destroy(): void;
}

const DEFAULT_ORIGIN = "https://mock-host.local";

export function createMockMcpHost(
  options: MockMcpHostOptions = {}
): MockMcpHost {
  const frameWindow = getFrameWindow(options.window);
  const origin = options.origin ?? DEFAULT_ORIGIN;
  const autoRespond = options.autoRespond ?? true;
  const defaultResponse = options.defaultResponse ?? { ok: true };
  const originalPostMessage = frameWindow.parent.postMessage;
  const requests: MockMcpHostMessage[] = [];
  let destroyed = false;

  frameWindow.parent.postMessage = ((message: unknown) => {
    if (!isJsonRpcMessage(message)) {
      return;
    }

    if (isKnownOutgoingMessage(message)) {
      requests.push(message);
    }

    if (autoRespond && isJsonRpcRequest(message)) {
      frameWindow.setTimeout(() => {
        dispatchToFrame({
          jsonrpc: "2.0",
          id: message.id,
          result: defaultResponse
        });
      }, 0);
    }
  }) as typeof frameWindow.parent.postMessage;

  function sendToolInput(params: unknown): void {
    assertActive();
    dispatchToFrame(
      createJsonRpcNotification(MCP_FRAME_METHODS.toolInput, params)
    );
  }

  function sendToolResult(params: ToolResultPayload): void {
    assertActive();
    dispatchToFrame(
      createJsonRpcNotification(MCP_FRAME_METHODS.toolResult, params)
    );
  }

  function getRequests(): MockMcpHostMessage[] {
    return [...requests];
  }

  function clearRequests(): void {
    requests.length = 0;
  }

  function destroy(): void {
    if (destroyed) {
      return;
    }

    destroyed = true;
    frameWindow.parent.postMessage = originalPostMessage;
    requests.length = 0;
  }

  function dispatchToFrame(message: JsonRpcMessage): void {
    frameWindow.dispatchEvent(
      new MessageEvent("message", {
        data: message,
        origin,
        source: frameWindow.parent
      })
    );
  }

  function assertActive(): void {
    if (destroyed) {
      throw new Error("Mock MCP host has been destroyed.");
    }
  }

  return {
    sendToolInput,
    sendToolResult,
    getRequests,
    clearRequests,
    destroy
  };
}

function isKnownOutgoingMessage(
  message: unknown
): message is MockMcpHostMessage {
  if (!isJsonRpcMessage(message)) {
    return false;
  }

  if (!("method" in message)) {
    return false;
  }

  return (
    message.method === MCP_FRAME_METHODS.toolCall ||
    message.method === MCP_FRAME_METHODS.message ||
    message.method === MCP_FRAME_METHODS.updateModelContext
  );
}

function getFrameWindow(explicitWindow?: Window): Window {
  const candidate = explicitWindow ?? globalThis.window;
  if (!candidate || !candidate.parent) {
    throw new Error(
      "createMockMcpHost() requires a browser-like window with a parent frame."
    );
  }

  return candidate;
}
