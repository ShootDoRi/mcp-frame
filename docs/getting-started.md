# Getting Started

Install the published React package from npm:

```bash
pnpm add @mcp-frame/react
```

If your TypeScript React app does not already include React type packages, add them too:

```bash
pnpm add -D @types/react @types/react-dom
```

Wrap your frame UI with `McpFrameProvider`, then read the latest tool result with `useToolResult()`.

```tsx
import { McpFrameProvider, useToolResult } from "@mcp-frame/react";

interface TodoResult {
  tasks: { id: string; title: string; done: boolean }[];
}

function TodoFrame() {
  const result = useToolResult<TodoResult>();

  return (
    <ul>
      {result.structuredContent?.tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
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

For runtime validation, pass any schema with a `safeParse(value)` method. Zod works, but application code does not need to import zod unless it wants schema validation.

```tsx
const result = useToolResult(todoResultSchema);

if (result.validationError) {
  return <p>Tool result shape changed.</p>;
}
```

Use `useMcpToolCall()` for `tools/call`, `useSendMessage()` for `ui/message`, and `useUpdateModelContext()` for `ui/update-model-context`.

For lower-level bridge work, install `@mcp-frame/core`. For local host simulation in tests, install `@mcp-frame/testing`.
