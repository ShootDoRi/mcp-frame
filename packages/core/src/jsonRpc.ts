import type {
  JsonRpcError,
  JsonRpcId,
  JsonRpcMessage,
  JsonRpcNotification,
  JsonRpcRequest,
  JsonRpcResponse
} from "./types";

let requestCounter = 0;

export function createRequestId(): string {
  requestCounter += 1;

  const cryptoLike = globalThis.crypto;
  if (cryptoLike && typeof cryptoLike.randomUUID === "function") {
    return cryptoLike.randomUUID();
  }

  return `mcp-frame-${Date.now()}-${requestCounter}`;
}

export function createJsonRpcRequest<
  TMethod extends string,
  TParams = unknown
>(method: TMethod, params?: TParams): JsonRpcRequest<TMethod, TParams> {
  return {
    jsonrpc: "2.0",
    id: createRequestId(),
    method,
    ...(params === undefined ? {} : { params })
  };
}

export function createJsonRpcNotification<
  TMethod extends string,
  TParams = unknown
>(method: TMethod, params?: TParams): JsonRpcNotification<TMethod, TParams> {
  return {
    jsonrpc: "2.0",
    method,
    ...(params === undefined ? {} : { params })
  };
}

export function isJsonRpcMessage(value: unknown): value is JsonRpcMessage {
  if (!isRecord(value) || value.jsonrpc !== "2.0") {
    return false;
  }

  if (typeof value.method === "string") {
    return !("id" in value) || isJsonRpcId(value.id);
  }

  return isJsonRpcId(value.id) && ("result" in value || isJsonRpcError(value.error));
}

export function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  return (
    isRecord(value) &&
    value.jsonrpc === "2.0" &&
    isJsonRpcId(value.id) &&
    typeof value.method === "string"
  );
}

export function isJsonRpcNotification(
  value: unknown
): value is JsonRpcNotification {
  return (
    isRecord(value) &&
    value.jsonrpc === "2.0" &&
    !("id" in value) &&
    typeof value.method === "string"
  );
}

export function isJsonRpcResponse(value: unknown): value is JsonRpcResponse {
  return (
    isRecord(value) &&
    value.jsonrpc === "2.0" &&
    isJsonRpcId(value.id) &&
    ("result" in value || isJsonRpcError(value.error))
  );
}

export function createJsonRpcError(
  code: number,
  message: string,
  data?: unknown
): JsonRpcError {
  return {
    code,
    message,
    ...(data === undefined ? {} : { data })
  };
}

function isJsonRpcId(value: unknown): value is JsonRpcId {
  return typeof value === "string" || typeof value === "number";
}

function isJsonRpcError(value: unknown): value is JsonRpcError {
  return (
    isRecord(value) &&
    typeof value.code === "number" &&
    typeof value.message === "string"
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
