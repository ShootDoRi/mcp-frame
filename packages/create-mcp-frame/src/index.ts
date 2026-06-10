#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import process from "node:process";

function main(): void {
  const appName = process.argv[2];

  if (!appName) {
    console.error("Usage: npx create-mcp-frame my-app");
    process.exit(1);
  }

  const root = resolve(process.cwd(), appName);

  if (existsSync(root)) {
    console.error(`Cannot create ${appName}: path already exists.`);
    process.exit(1);
  }

  mkdirSync(join(root, "src"), { recursive: true });

  write("package.json", packageJson(basename(root)));
  write("index.html", indexHtml);
  write("tsconfig.json", tsconfigJson);
  write("vite.config.ts", viteConfig);
  write("src/main.tsx", mainTsx);
  write("src/App.tsx", appTsx);
  write("src/styles.css", stylesCss);
  write("README.md", readme(basename(root)));

  console.log(`Created ${appName}.`);
  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${appName}`);
  console.log("  pnpm install");
  console.log("  pnpm dev");

  function write(path: string, content: string): void {
    writeFileSync(join(root, path), content);
  }
}

function packageJson(name: string): string {
  return `${JSON.stringify(
    {
      name,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc -p tsconfig.json --noEmit && vite build",
        typecheck: "tsc -p tsconfig.json --noEmit"
      },
      dependencies: {
        "@mcp-frame/react": "^0.1.0",
        "@vitejs/plugin-react": "^4.5.1",
        vite: "^6.3.5",
        typescript: "^5.8.3",
        react: "^19.1.0",
        "react-dom": "^19.1.0"
      },
      devDependencies: {
        "@types/react": "^19.1.7",
        "@types/react-dom": "^19.1.6"
      }
    },
    null,
    2
  )}\n`;
}

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="data:," />
    <title>MCP frame app</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const tsconfigJson = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "include": ["src", "vite.config.ts"]
}
`;

const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()]
});
`;

const mainTsx = `import { createRoot } from "react-dom/client";
import { McpFrameProvider } from "@mcp-frame/react";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <McpFrameProvider>
    <App />
  </McpFrameProvider>
);
`;

const appTsx = `import { useToolResult } from "@mcp-frame/react";

interface TodoResult {
  tasks: { id: string; title: string; done: boolean }[];
}

export function App() {
  const result = useToolResult<TodoResult>();
  const tasks = result.structuredContent?.tasks ?? [];

  return (
    <main className="shell">
      <h1>MCP frame</h1>
      {tasks.length === 0 ? (
        <p>Waiting for a tool result...</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              {task.done ? "Done" : "Todo"} - {task.title}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
`;

const stylesCss = `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #1f2328;
}

.shell {
  width: min(680px, calc(100vw - 32px));
  margin: 32px auto;
}
`;

function readme(name: string): string {
  return `# ${name}

Minimal Vite + React MCP frame created with \`create-mcp-frame\`.

## Run

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Wrap your app in \`McpFrameProvider\`, then read tool results with \`useToolResult()\`.
`;
}

main();
