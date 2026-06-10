# Testing

`@mcp-frame/testing` provides `createMockMcpHost()` for unit tests and local examples.

Install it from npm as a development dependency:

```bash
pnpm add -D @mcp-frame/testing
```

```ts
import { createMcpFrameBridge } from "@mcp-frame/core";
import { createMockMcpHost } from "@mcp-frame/testing";

const host = createMockMcpHost();
const bridge = createMcpFrameBridge();

host.sendToolResult({
  structuredContent: {
    tasks: [{ id: "1", title: "Write docs", done: false }]
  }
});

void bridge.callTool("toggle_task", { id: "1" });

expect(host.getRequests()[0]?.method).toBe("tools/call");

bridge.destroy();
host.destroy();
```

The mock host:

- Sends `ui/notifications/tool-input`.
- Sends `ui/notifications/tool-result`.
- Records outgoing `tools/call`, `ui/message`, and `ui/update-model-context` messages.
- Auto-responds to JSON-RPC requests by default so local demos do not hang.
- Restores patched `postMessage` behavior on `destroy()`.

It is intentionally lightweight. It is not a full host implementation.
