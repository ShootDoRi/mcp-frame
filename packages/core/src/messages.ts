import {
  isJsonRpcNotification,
  isRecord
} from "./jsonRpc";
import { MCP_FRAME_METHODS } from "./types";
import type {
  ToolInputNotification,
  ToolResultNotification,
  ToolResultPayload
} from "./types";

export function isToolInputNotification(
  value: unknown
): value is ToolInputNotification {
  return (
    isJsonRpcNotification(value) &&
    value.method === MCP_FRAME_METHODS.toolInput
  );
}

export function isToolResultNotification(
  value: unknown
): value is ToolResultNotification {
  return (
    isJsonRpcNotification(value) &&
    value.method === MCP_FRAME_METHODS.toolResult &&
    isToolResultPayload(value.params)
  );
}

export function isToolResultPayload(
  value: unknown
): value is ToolResultPayload {
  if (!isRecord(value)) {
    return false;
  }

  if ("content" in value && !Array.isArray(value.content)) {
    return false;
  }

  return true;
}
