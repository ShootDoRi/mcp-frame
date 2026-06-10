import {
  useMcpToolCall,
  useSendMessage,
  useToolResult,
  useUpdateModelContext
} from "@mcp-frame/react";
import type { TodoStructuredContent } from "./mockData";
import "./styles.css";

export function App() {
  const result = useToolResult<TodoStructuredContent>();
  const callTool = useMcpToolCall();
  const sendMessage = useSendMessage();
  const updateModelContext = useUpdateModelContext();
  const tasks = result.structuredContent?.tasks ?? [];

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">mcp-frame example</p>
          <h1>Todo frame</h1>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            sendMessage({ content: "The todo frame is open." });
            void updateModelContext({ visibleTasks: tasks.length });
          }}
        >
          Share context
        </button>
      </header>

      <section className="task-list" aria-label="Tasks">
        {tasks.length === 0 ? (
          <p className="empty">Waiting for a tool result...</p>
        ) : (
          tasks.map((task) => (
            <button
              className="task-row"
              key={task.id}
              type="button"
              onClick={() => {
                void callTool("toggle_task", { id: task.id });
                void updateModelContext({ selectedTaskId: task.id });
              }}
            >
              <span className={task.done ? "status done" : "status"} />
              <span className="task-title">{task.title}</span>
              <span className="task-state">{task.done ? "Done" : "Todo"}</span>
            </button>
          ))
        )}
      </section>
    </main>
  );
}
