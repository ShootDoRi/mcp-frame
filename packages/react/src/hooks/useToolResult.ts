import { useMemo } from "react";
import { validateWithSchema } from "@mcp-frame/core";
import type { SafeParseSchema, ToolResultPayload } from "@mcp-frame/core";
import { useMcpFrame } from "./useMcpFrame";

export interface UseToolResultValue<
  TStructuredContent = unknown,
  TMeta = unknown
> {
  result?: ToolResultPayload<unknown, TMeta>;
  content?: unknown[];
  structuredContent?: TStructuredContent;
  _meta?: TMeta;
  validationError?: unknown;
}

export function useToolResult<
  TStructuredContent = unknown,
  TMeta = unknown
>(
  schema?: SafeParseSchema<TStructuredContent>
): UseToolResultValue<TStructuredContent, TMeta> {
  const rawResult = useMcpFrame().toolResult as
    | ToolResultPayload<unknown, TMeta>
    | undefined;

  return useMemo(() => {
    if (!rawResult) {
      return {};
    }

    const parsed = validateWithSchema(
      rawResult.structuredContent,
      schema
    );

    if (parsed.error) {
      return {
        result: rawResult,
        content: rawResult.content,
        _meta: rawResult._meta,
        structuredContent: undefined,
        validationError: parsed.error
      };
    }

    return {
      result: rawResult,
      content: rawResult.content,
      _meta: rawResult._meta,
      structuredContent: parsed.data,
      validationError: undefined
    };
  }, [rawResult, schema]);
}
