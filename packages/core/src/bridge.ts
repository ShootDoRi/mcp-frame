import {
  createJsonRpcNotification,
  createJsonRpcRequest,
  isJsonRpcMessage,
  isJsonRpcRequest,
  isJsonRpcResponse
} from "./jsonRpc";
import { MCP_FRAME_METHODS } from "./types";
import type {
  JsonRpcId,
  JsonRpcRequest,
  JsonRpcResponse,
  McpFrameBridge,
  McpFrameBridgeListener,
  McpFrameBridgeOptions,
  SendMessageWaitOptions,
  UiMessageParams,
  UpdateModelContextParams
} from "./types";

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

interface PendingRequest {
  resolve(value: unknown): void;
  reject(reason: Error): void;
  timeoutId: number;
}

export class McpFrameBridgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpFrameBridgeError";
  }
}

export class McpFrameBridgeDestroyedError extends McpFrameBridgeError {
  constructor() {
    super("The MCP frame bridge was destroyed before the request completed.");
    this.name = "McpFrameBridgeDestroyedError";
  }
}

export class McpFrameBridgeTimeoutError extends McpFrameBridgeError {
  constructor(timeoutMs: number) {
    super(`MCP frame bridge request timed out after ${timeoutMs}ms.`);
    this.name = "McpFrameBridgeTimeoutError";
  }
}

export class McpFrameBridgeJsonRpcError extends McpFrameBridgeError {
  readonly code: number;
  readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = "McpFrameBridgeJsonRpcError";
    this.code = code;
    this.data = data;
  }
}

export function createMcpFrameBridge(
  options: McpFrameBridgeOptions = {}
): McpFrameBridge {
  const frameWindow = getFrameWindow(options.window);
  const targetOrigin = options.targetOrigin ?? "*";
  const timeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const listeners = new Set<McpFrameBridgeListener>();
  const pendingRequests = new Map<JsonRpcId, PendingRequest>();
  let destroyed = false;

  const handleMessage = (event: MessageEvent): void => {
    if (event.source !== frameWindow.parent) {
      return;
    }

    if (!isIncomingOriginAllowed(event.origin, options)) {
      return;
    }

    const message = event.data;
    if (!isJsonRpcMessage(message)) {
      return;
    }

    if (isJsonRpcResponse(message)) {
      settleResponse(message);
      return;
    }

    if (!isJsonRpcRequest(message) && typeof message.method !== "string") {
      return;
    }

    listeners.forEach((listener) => {
      listener(message, event);
    });
  };

  frameWindow.addEventListener("message", handleMessage);

  function subscribe(listener: McpFrameBridgeListener): () => void {
    assertActive();
    listeners.add(listener);
    return () => unsubscribe(listener);
  }

  function unsubscribe(listener: McpFrameBridgeListener): void {
    listeners.delete(listener);
  }

  function callTool(name: string, args?: unknown): Promise<unknown> {
    return sendRequest(
      createJsonRpcRequest(MCP_FRAME_METHODS.toolCall, {
        name,
        ...(args === undefined ? {} : { arguments: args })
      })
    );
  }

  function sendMessage(message: UiMessageParams): void;
  function sendMessage(
    message: UiMessageParams,
    options: SendMessageWaitOptions
  ): Promise<unknown>;
  function sendMessage(
    message: UiMessageParams,
    sendOptions?: SendMessageWaitOptions
  ): void | Promise<unknown> {
    if (sendOptions?.waitForResponse) {
      return sendRequest(createJsonRpcRequest(MCP_FRAME_METHODS.message, message));
    }

    post(createJsonRpcNotification(MCP_FRAME_METHODS.message, message));
  }

  function updateModelContext(
    context: UpdateModelContextParams
  ): Promise<unknown> {
    return sendRequest(
      createJsonRpcRequest(MCP_FRAME_METHODS.updateModelContext, context)
    );
  }

  function destroy(): void {
    if (destroyed) {
      return;
    }

    destroyed = true;
    frameWindow.removeEventListener("message", handleMessage);
    listeners.clear();

    const error = new McpFrameBridgeDestroyedError();
    pendingRequests.forEach((pending) => {
      frameWindow.clearTimeout(pending.timeoutId);
      pending.reject(error);
    });
    pendingRequests.clear();
  }

  function sendRequest(request: JsonRpcRequest): Promise<unknown> {
    assertActive();

    return new Promise((resolve, reject) => {
      const timeoutId = frameWindow.setTimeout(() => {
        pendingRequests.delete(request.id);
        reject(new McpFrameBridgeTimeoutError(timeoutMs));
      }, timeoutMs);

      pendingRequests.set(request.id, {
        resolve,
        reject,
        timeoutId
      });

      post(request);
    });
  }

  function post(message: unknown): void {
    assertActive();
    frameWindow.parent.postMessage(message, targetOrigin);
  }

  function settleResponse(response: JsonRpcResponse): void {
    const pending = pendingRequests.get(response.id);
    if (!pending) {
      return;
    }

    pendingRequests.delete(response.id);
    frameWindow.clearTimeout(pending.timeoutId);

    if (response.error) {
      pending.reject(
        new McpFrameBridgeJsonRpcError(
          response.error.code,
          response.error.message,
          response.error.data
        )
      );
      return;
    }

    pending.resolve(response.result);
  }

  function assertActive(): void {
    if (destroyed) {
      throw new McpFrameBridgeDestroyedError();
    }
  }

  return {
    subscribe,
    unsubscribe,
    callTool,
    sendMessage,
    updateModelContext,
    destroy
  };
}

function getFrameWindow(explicitWindow?: Window): Window {
  const candidate = explicitWindow ?? globalThis.window;

  if (!candidate || !candidate.parent) {
    throw new McpFrameBridgeError(
      "createMcpFrameBridge() requires a browser-like window with a parent frame."
    );
  }

  return candidate;
}

function isIncomingOriginAllowed(
  origin: string,
  options: McpFrameBridgeOptions
): boolean {
  const allowedOrigins = options.allowedOrigins;
  if (!allowedOrigins || allowedOrigins.length === 0) {
    return true;
  }

  if (allowedOrigins.includes("*")) {
    return options.allowAnyOrigin === true;
  }

  return allowedOrigins.includes(origin);
}
