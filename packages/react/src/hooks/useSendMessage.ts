import type { McpFrameBridge } from "@mcp-frame/core";
import { useMcpFrame } from "./useMcpFrame";

export function useSendMessage(): McpFrameBridge["sendMessage"] {
  return useMcpFrame().sendMessage;
}
