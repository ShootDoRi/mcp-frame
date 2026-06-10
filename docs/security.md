# Security

Iframe bridge payloads are untrusted runtime data. `mcp-frame` gives you typed helpers and validation hooks, but it does not turn client-side checks into a security boundary.

## Origin Controls

`allowedOrigins` is the incoming trust boundary. When configured, the bridge ignores incoming messages whose `event.origin` is not in the list.

```ts
createMcpFrameBridge({
  allowedOrigins: ["https://your-host.example"]
});
```

`targetOrigin` is the outgoing `postMessage` destination. Prefer a concrete origin in production.

```ts
createMcpFrameBridge({
  targetOrigin: "https://your-host.example"
});
```

`allowAnyOrigin` is only for development. It is required for `allowedOrigins: ["*"]` to work, so wildcard trust must be explicit.

```ts
createMcpFrameBridge({
  allowedOrigins: ["*"],
  allowAnyOrigin: true
});
```

## Payload Handling

- Do not put secrets, tokens, credentials, or private server-only data in `structuredContent`.
- Treat `_meta` as host-visible/client-visible data unless your host contract says otherwise.
- Validate `structuredContent` before rendering assumptions-heavy UI.
- Do not render arbitrary HTML from tool results without sanitizing it.

## Server-Side Validation

All server-side tool inputs must still be validated. A frame can help a user produce good inputs, but the server must enforce authorization, schemas, and business rules.

## Host Compatibility

The MVP is MCP-first and host-agnostic. It does not build around `window.openai`. If a host exposes `window.openai`, support should live in an optional compatibility or extension layer rather than the core contract.
