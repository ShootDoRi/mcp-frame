# Bridge

MCP app frames run inside iframes. `mcp-frame` communicates with the host using JSON-RPC 2.0 messages sent through `postMessage`.

The v0.1 bridge is intentionally MCP-first and host-agnostic. It does not depend on `window.openai`; that can be added later as an optional compatibility layer for hosts that expose it.

## Supported v0.1 Messages

Host to frame:

- `ui/notifications/tool-input`
- `ui/notifications/tool-result`

Frame to host:

- `tools/call`
- `ui/message`
- `ui/update-model-context`

Planned / experimental lifecycle concepts:

- `ui/initialize`
- `ui/notifications/initialized`

The lifecycle names are known to the type surface and docs, but a full initialization handshake is not part of v0.1.

## Requests And Notifications

`callTool(name, args)` sends a `tools/call` request and returns a promise.

`updateModelContext(context)` sends a `ui/update-model-context` request and returns a promise.

`sendMessage(message)` sends `ui/message` as a JSON-RPC notification and returns `void`.

`sendMessage(message, { waitForResponse: true })` sends `ui/message` as a JSON-RPC request and returns a promise.

Request promises resolve on matching JSON-RPC responses, reject on JSON-RPC errors, reject on timeout, and reject if the bridge is destroyed before completion.

## Import Safety

Importing `@mcp-frame/core` does not access `window`. Only `createMcpFrameBridge()` requires a browser-like environment. If no browser-like `window.parent` is available, it throws a clear runtime error.
