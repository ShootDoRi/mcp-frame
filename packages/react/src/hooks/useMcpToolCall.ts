import type { McpFrameBridge } from "@mcp-frame/core";
import { useMcpFrame } from "./useMcpFrame";

export function useMcpToolCall(): McpFrameBridge["callTool"] {
  return useMcpFrame().callTool;
}
