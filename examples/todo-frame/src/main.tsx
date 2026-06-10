import { createRoot } from "react-dom/client";
import { createMcpFrameBridge } from "@mcp-frame/core";
import { McpFrameProvider } from "@mcp-frame/react";
import { createMockMcpHost } from "@mcp-frame/testing";
import { App } from "./App";
import { mockTodoResult } from "./mockData";

const MOCK_ORIGIN = "https://mock-host.local";

const mockHost = import.meta.env.DEV
  ? createMockMcpHost({ origin: MOCK_ORIGIN })
  : undefined;

const bridge = createMcpFrameBridge(
  import.meta.env.DEV
    ? {
        allowedOrigins: [MOCK_ORIGIN],
        targetOrigin: MOCK_ORIGIN
      }
    : {}
);

createRoot(document.getElementById("root")!).render(
  <McpFrameProvider bridge={bridge}>
    <App />
  </McpFrameProvider>
);

if (mockHost) {
  window.setTimeout(() => {
    mockHost.sendToolResult(mockTodoResult);
  }, 50);
}
