import type { ToolResultPayload } from "@mcp-frame/core";

export interface TodoTask {
  id: string;
  title: string;
  done: boolean;
}

export const todoTasksFixture: TodoTask[] = [
  { id: "1", title: "Create initial bridge", done: true },
  { id: "2", title: "Build React hooks", done: false },
  { id: "3", title: "Write docs", done: false }
];

export const todoToolResultFixture: ToolResultPayload<{
  tasks: TodoTask[];
}> = {
  structuredContent: {
    tasks: todoTasksFixture
  }
};
