export type JsonRpcId = string | number;

export interface JsonRpcRequest<
  TMethod extends string = string,
  TParams = unknown
> {
  jsonrpc: "2.0";
  id: JsonRpcId;
  method: TMethod;
  params?: TParams;
}

export interface JsonRpcNotification<
  TMethod extends string = string,
  TParams = unknown
> {
  jsonrpc: "2.0";
  method: TMethod;
  params?: TParams;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcResponse<TResult = unknown> {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: TResult;
  error?: JsonRpcError;
}

export type JsonRpcMessage =
  | JsonRpcRequest
  | JsonRpcNotification
  | JsonRpcResponse;

export const MCP_FRAME_METHODS = {
  toolInput: "ui/notifications/tool-input",
  toolResult: "ui/notifications/tool-result",
  initialize: "ui/initialize",
  initialized: "ui/notifications/initialized",
  toolCall: "tools/call",
  message: "ui/message",
  updateModelContext: "ui/update-model-context"
} as const;

export type KnownMcpFrameMethod =
  (typeof MCP_FRAME_METHODS)[keyof typeof MCP_FRAME_METHODS];

export type ToolInputNotification<TParams = unknown> = JsonRpcNotification<
  typeof MCP_FRAME_METHODS.toolInput,
  TParams
>;

export interface ToolResultPayload<
  TStructuredContent = unknown,
  TMeta = unknown
> {
  content?: unknown[];
  structuredContent?: TStructuredContent;
  _meta?: TMeta;
}

export type ToolResultNotification<
  TStructuredContent = unknown,
  TMeta = unknown
> = JsonRpcNotification<
  typeof MCP_FRAME_METHODS.toolResult,
  ToolResultPayload<TStructuredContent, TMeta>
>;

export interface ToolCallParams {
  name: string;
  arguments?: unknown;
}

export type ToolCallRequest = JsonRpcRequest<
  typeof MCP_FRAME_METHODS.toolCall,
  ToolCallParams
>;

export interface UiMessageParams {
  content: unknown;
  role?: string;
  _meta?: unknown;
  [key: string]: unknown;
}

export type UiMessageRequest = JsonRpcRequest<
  typeof MCP_FRAME_METHODS.message,
  UiMessageParams
>;

export type UiMessageNotification = JsonRpcNotification<
  typeof MCP_FRAME_METHODS.message,
  UiMessageParams
>;

export type UpdateModelContextParams = Record<string, unknown>;

export type UpdateModelContextRequest = JsonRpcRequest<
  typeof MCP_FRAME_METHODS.updateModelContext,
  UpdateModelContextParams
>;

export interface InitializeParams {
  [key: string]: unknown;
}

export type InitializeRequest = JsonRpcRequest<
  typeof MCP_FRAME_METHODS.initialize,
  InitializeParams
>;

export type InitializedNotification = JsonRpcNotification<
  typeof MCP_FRAME_METHODS.initialized,
  Record<string, unknown>
>;

export interface McpFrameBridgeOptions {
  allowedOrigins?: string[];
  allowAnyOrigin?: boolean;
  targetOrigin?: string;
  requestTimeoutMs?: number;
  window?: Window;
}

export type McpFrameBridgeListener = (
  message: JsonRpcRequest | JsonRpcNotification,
  event: MessageEvent
) => void;

export interface SendMessageWaitOptions {
  waitForResponse: true;
}

export interface McpFrameBridge {
  subscribe(listener: McpFrameBridgeListener): () => void;
  unsubscribe(listener: McpFrameBridgeListener): void;
  callTool(name: string, args?: unknown): Promise<unknown>;
  sendMessage(message: UiMessageParams): void;
  sendMessage(
    message: UiMessageParams,
    options: SendMessageWaitOptions
  ): Promise<unknown>;
  updateModelContext(context: UpdateModelContextParams): Promise<unknown>;
  destroy(): void;
}
