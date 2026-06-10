import { useContext } from "react";
import { McpFrameContext } from "../provider";

export function useMcpFrame() {
  const context = useContext(McpFrameContext);

  if (!context) {
    throw new Error("useMcpFrame must be used within McpFrameProvider.");
  }

  return context;
}
