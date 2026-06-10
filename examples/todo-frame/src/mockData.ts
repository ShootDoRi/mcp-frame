export interface TodoTask {
  id: string;
  title: string;
  done: boolean;
}

export interface TodoStructuredContent {
  tasks: TodoTask[];
}

export const mockTodoResult = {
  structuredContent: {
    tasks: [
      { id: "1", title: "Create initial bridge", done: true },
      { id: "2", title: "Build React hooks", done: false },
      { id: "3", title: "Write docs", done: false }
    ]
  }
};
