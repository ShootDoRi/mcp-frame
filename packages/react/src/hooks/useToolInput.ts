import { useMcpFrame } from "./useMcpFrame";

export function useToolInput<T = unknown>(): T | undefined {
  return useMcpFrame().toolInput as T | undefined;
}
