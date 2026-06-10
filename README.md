# mcp-frame

[![Release](https://img.shields.io/github/v/release/ShootDoRi/mcp-frame?label=release)](https://github.com/ShootDoRi/mcp-frame/releases/tag/v0.1.0)
[![core](https://img.shields.io/npm/v/@mcp-frame/core?label=%40mcp-frame%2Fcore)](https://www.npmjs.com/package/@mcp-frame/core)
[![react](https://img.shields.io/npm/v/@mcp-frame/react?label=%40mcp-frame%2Freact)](https://www.npmjs.com/package/@mcp-frame/react)
[![testing](https://img.shields.io/npm/v/@mcp-frame/testing?label=%40mcp-frame%2Ftesting)](https://www.npmjs.com/package/@mcp-frame/testing)
[![create](https://img.shields.io/npm/v/create-mcp-frame?label=create-mcp-frame)](https://www.npmjs.com/package/create-mcp-frame)

[v0.1.0 is published](https://github.com/ShootDoRi/mcp-frame/releases/tag/v0.1.0) on GitHub Releases and npm.

`mcp-frame` is an early MVP toolkit for building iframe-based MCP app frames with TypeScript and React. It is MCP-first and host-agnostic: the core assumption is JSON-RPC 2.0 over `postMessage`, not any one host runtime.

`mcp-frame` is not a visual component library and not an MCP server framework. It focuses on typed bridge utilities, React hooks, validation ergonomics, and local testing helpers for iframe-based MCP app frames.

The project helps React developers build app frames faster by providing:

- A small typed bridge for MCP UI messages.
- React provider and hooks for tool input, tool results, tool calls, messages, and model-context updates.
- Runtime validation hooks that work with any `safeParse`-compatible schema.
- A lightweight mock host for tests and local examples.
- A Vite todo-frame example and a minimal scaffold CLI.

## Project Status

- v0.1.0 is published to npm and GitHub Releases.
- CI release gate exists for type-checking, tests, builds, the example app, and release smoke checks.
- Package tarball smoke checks verify packed dependencies and external installation behavior.
- External consumer smoke has been verified against the published package shape.
- Early MVP. APIs are intentionally small and may evolve before 1.0.

## Install

```bash
pnpm add @mcp-frame/react
```

Use `@mcp-frame/core` directly when you need lower-level bridge control:

```bash
pnpm add @mcp-frame/core
```

Use `@mcp-frame/testing` for local host simulation:

```bash
pnpm add -D @mcp-frame/testing
```

Scaffold a new Vite React frame:

```bash
pnpm dlx create-mcp-frame my-app
```

TypeScript React projects may also need React type packages:

```bash
pnpm add -D @types/react @types/react-dom
```

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
