# OpenAI Codex for OSS Application Note

## Project Summary

`mcp-frame` is a TypeScript-first React toolkit for building iframe-based MCP app UIs. It provides a small JSON-RPC bridge over `postMessage`, React hooks, optional runtime validation, local testing utilities, and a Vite example app.

The project is intentionally MCP-first and host-agnostic. It is not a visual component library and not an MCP server framework.

## Maintainer Role

The current maintainer is responsible for:

- Core bridge design and runtime safety.
- React API design and tests.
- Package release checks and npm publishing.
- Documentation, examples, and issue triage.
- Keeping the project small enough for a stable pre-1.0 API path.

## Ecosystem Relevance

MCP app UIs often run inside iframes and communicate with a host through JSON-RPC 2.0 over `postMessage`. React developers building those frames need a reliable way to:

- Read tool input and tool result notifications.
- Send `tools/call`, `ui/message`, and `ui/update-model-context` messages.
- Validate untrusted payloads before rendering.
- Test frame behavior locally without a full host implementation.

`mcp-frame` packages these concerns as reusable OSS building blocks so individual app-frame projects do not need to reimplement the bridge, hooks, and mock host from scratch.

## How Codex/API Credits Would Help

OpenAI Codex or API credits would directly support maintenance work such as:

- Reviewing bridge lifecycle edge cases and security-sensitive message handling.
- Expanding test coverage around iframe communication and package-consumer behavior.
- Keeping documentation examples current as MCP Apps conventions evolve.
- Auditing public API changes before 1.0.
- Improving the scaffold CLI and local examples without adding unnecessary runtime scope.

## Release Evidence

- GitHub Release: https://github.com/ShootDoRi/mcp-frame/releases/tag/v0.1.0
- npm: https://www.npmjs.com/package/@mcp-frame/core
- npm: https://www.npmjs.com/package/@mcp-frame/react
- npm: https://www.npmjs.com/package/@mcp-frame/testing
- npm: https://www.npmjs.com/package/create-mcp-frame

Published v0.1.0 packages:

- `@mcp-frame/core@0.1.0`
- `@mcp-frame/react@0.1.0`
- `@mcp-frame/testing@0.1.0`
- `create-mcp-frame@0.1.0`

Release readiness includes CI checks, package tarball smoke tests, and an external consumer smoke verification.

## Current Roadmap

- Stabilize the bridge initialization lifecycle around `ui/initialize` and `ui/notifications/initialized`.
- Keep the main React API small while improving examples and documentation.
- Add richer local host testing utilities.
- Improve `create-mcp-frame` once the package APIs settle.
- Evaluate optional host compatibility layers without making them the core contract.
