# mcp-frame

`mcp-frame` is an early MVP toolkit for building iframe-based MCP app frames with TypeScript and React. It is MCP-first and host-agnostic: the core assumption is JSON-RPC 2.0 over `postMessage`, not any one host runtime.

The project helps React developers build app frames faster by providing:

- A small typed bridge for MCP UI messages.
- React provider and hooks for tool input, tool results, tool calls, messages, and model-context updates.
- Runtime validation hooks that work with any `safeParse`-compatible schema.
- A lightweight mock host for tests and local examples.
- A Vite todo-frame example and a minimal scaffold CLI.

## Status

Early MVP. APIs are intentionally small and may evolve before a stable release.

## Install

```bash
pnpm add @mcp-frame/react
```

Use `@mcp-frame/core` directly when you need lower-level bridge control, and `@mcp-frame/testing` for local host simulation.

## Basic Usage

```tsx
import {
  McpFrameProvider,
  useMcpToolCall,
  useToolResult
} from "@mcp-frame/react";

function TodoFrame() {
  const result = useToolResult<{
    tasks: { id: string; title: string; done: boolean }[];
  }>();
  const callTool = useMcpToolCall();

  return (
    <div>
      {result.structuredContent?.tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => void callTool("toggle_task", { id: task.id })}
        >
          {task.done ? "Done" : "Todo"} - {task.title}
        </button>
      ))}
    </div>
  );
}

export function App() {
  return (
    <McpFrameProvider
      options={{
        allowedOrigins: ["https://your-host.example"],
        targetOrigin: "https://your-host.example"
      }}
    >
      <TodoFrame />
    </McpFrameProvider>
  );
}
```

## Packages

- `@mcp-frame/core`: JSON-RPC types, message guards, validation helpers, and `createMcpFrameBridge()`.
- `@mcp-frame/react`: `McpFrameProvider` plus the small public hook API.
- `@mcp-frame/testing`: local mock host utilities.
- `create-mcp-frame`: minimal Vite React TypeScript scaffold.

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm --filter todo-frame dev
```

## Bridge Methods

Supported in v0.1:

- Host to frame: `ui/notifications/tool-input`
- Host to frame: `ui/notifications/tool-result`
- Frame to host: `tools/call`
- Frame to host: `ui/message`
- Frame to host: `ui/update-model-context`

Planned / experimental lifecycle concepts:

- `ui/initialize`
- `ui/notifications/initialized`

These lifecycle names are documented so the API can evolve without surprising users, but v0.1 does not implement a full initialization lifecycle.

## Security Notes

- `allowedOrigins` controls which incoming host origins are trusted.
- `targetOrigin` controls where outgoing `postMessage` calls are sent.
- `allowAnyOrigin` is a development-only escape hatch for `allowedOrigins: ["*"]`.
- Do not put secrets or tokens in `structuredContent` or `_meta`.
- Treat all iframe messages as untrusted runtime data.
- Server-side tool inputs must still be validated. Client validation is developer ergonomics, not a security boundary.

`mcp-frame` does not build around `window.openai`. A future compatibility layer may integrate host-specific APIs such as `window.openai`, but the MVP remains MCP-first and host-agnostic.

## Roadmap

- Stabilize the bridge initialization lifecycle.
- Add more host compatibility adapters without making them the default contract.
- Expand test helpers for richer local simulations.
- Improve scaffolding once the package APIs settle.
