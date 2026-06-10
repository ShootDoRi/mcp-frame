import type { McpFrameBridge } from "@mcp-frame/core";
import { useMcpFrame } from "./useMcpFrame";

export function useUpdateModelContext(): McpFrameBridge["updateModelContext"] {
  return useMcpFrame().updateModelContext;
}
