/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  MCP_FRAME_METHODS,
  createMcpFrameBridge,
  isToolResultNotification
} from "@mcp-frame/core";
import { createMockMcpHost } from "../src";

const hosts: Array<{ destroy(): void }> = [];
const bridges: Array<{ destroy(): void }> = [];

afterEach(() => {
  bridges.splice(0).forEach((bridge) => bridge.destroy());
  hosts.splice(0).forEach((host) => host.destroy());
});

describe("createMockMcpHost", () => {
  it("sends tool result notifications to the frame", () => {
    const host = trackHost(createMockMcpHost());
    const bridge = trackBridge(createMcpFrameBridge());
    const received: unknown[] = [];

    bridge.subscribe((message) => {
      if (isToolResultNotification(message)) {
        received.push(message.params?.structuredContent);
      }
    });

    host.sendToolResult({
      structuredContent: {
        tasks: [{ id: "1", title: "Write tests", done: false }]
      }
    });

    expect(received).toEqual([
      { tasks: [{ id: "1", title: "Write tests", done: false }] }
    ]);
  });

  it("records outgoing tool calls, messages, and model context updates", async () => {
    const host = trackHost(createMockMcpHost());
    const bridge = trackBridge(createMcpFrameBridge());

    const callToolPromise = bridge.callTool("toggle_task", { id: "1" });
    bridge.sendMessage({ content: "Opened todo frame" });
    const updatePromise = bridge.updateModelContext({ selectedTask: "1" });

    await expect(callToolPromise).resolves.toEqual({ ok: true });
    await expect(updatePromise).resolves.toEqual({ ok: true });

    expect(host.getRequests().map((request) => request.method)).toEqual([
      MCP_FRAME_METHODS.toolCall,
      MCP_FRAME_METHODS.message,
      MCP_FRAME_METHODS.updateModelContext
    ]);

    host.clearRequests();
    expect(host.getRequests()).toEqual([]);
  });
});

function trackHost<T extends { destroy(): void }>(host: T): T {
  hosts.push(host);
  return host;
}

function trackBridge<T extends { destroy(): void }>(bridge: T): T {
  bridges.push(bridge);
  return bridge;
}
