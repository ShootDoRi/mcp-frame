import {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  createMcpFrameBridge,
  isToolInputNotification,
  isToolResultNotification
} from "@mcp-frame/core";
import type {
  McpFrameBridge,
  McpFrameBridgeOptions,
  ToolResultPayload
} from "@mcp-frame/core";
import type { PropsWithChildren } from "react";

export interface McpFrameContextValue {
  bridge: McpFrameBridge;
  toolInput?: unknown;
  toolResult?: ToolResultPayload;
  callTool: McpFrameBridge["callTool"];
  sendMessage: McpFrameBridge["sendMessage"];
  updateModelContext: McpFrameBridge["updateModelContext"];
}

export interface McpFrameProviderProps extends PropsWithChildren {
  bridge?: McpFrameBridge;
  options?: McpFrameBridgeOptions;
}

export const McpFrameContext = createContext<McpFrameContextValue | undefined>(
  undefined
);

export function McpFrameProvider({
  bridge,
  children,
  options
}: McpFrameProviderProps) {
  const ownedBridgeRef = useRef<McpFrameBridge | null>(null);
  const [toolInput, setToolInput] = useState<unknown>();
  const [toolResult, setToolResult] = useState<ToolResultPayload>();

  if (!bridge && !ownedBridgeRef.current) {
    ownedBridgeRef.current = createMcpFrameBridge(options);
  }

  const activeBridge = bridge ?? ownedBridgeRef.current;
  if (!activeBridge) {
    throw new Error("McpFrameProvider could not create an MCP frame bridge.");
  }

  useEffect(() => {
    return activeBridge.subscribe((message) => {
      if (isToolInputNotification(message)) {
        setToolInput(message.params);
        return;
      }

      if (isToolResultNotification(message)) {
        setToolResult(message.params);
      }
    });
  }, [activeBridge]);

  useEffect(() => {
    return () => {
      if (!bridge) {
        ownedBridgeRef.current?.destroy();
        ownedBridgeRef.current = null;
      }
    };
  }, [bridge]);

  const value = useMemo<McpFrameContextValue>(
    () => ({
      bridge: activeBridge,
      toolInput,
      toolResult,
      callTool: activeBridge.callTool,
      sendMessage: activeBridge.sendMessage,
      updateModelContext: activeBridge.updateModelContext
    }),
    [activeBridge, toolInput, toolResult]
  );

  return (
    <McpFrameContext.Provider value={value}>
      {children}
    </McpFrameContext.Provider>
  );
}
