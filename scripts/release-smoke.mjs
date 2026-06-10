import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  inspectPackedPackage,
  packPackage,
  run,
  smokePackages
} from "./release-utils.mjs";

const rootDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const tempDir = mkdtempSync(path.join(os.tmpdir(), "mcp-frame-release-smoke-"));
const packDir = path.join(tempDir, "packs");
const consumerDir = path.join(tempDir, "consumer");

mkdirSync(packDir, { recursive: true });
mkdirSync(consumerDir, { recursive: true });

console.log("building workspace packages and example");
run("pnpm", ["build"], { cwd: rootDir });

const packed = new Map();
for (const packageInfo of smokePackages) {
  const tarball = packPackage(rootDir, packageInfo, packDir);
  const inspected = inspectPackedPackage(tarball);

  if (JSON.stringify(inspected.manifest).includes("workspace:")) {
    throw new Error(`${packageInfo.name} tarball contains a workspace: spec.`);
  }

  for (const requiredPath of [
    "package/README.md",
    "package/LICENSE",
    "package/dist/index.js",
    "package/dist/index.d.ts"
  ]) {
    if (!inspected.entries.includes(requiredPath)) {
      throw new Error(
        `${packageInfo.name} tarball is missing ${requiredPath}.`
      );
    }
  }

  packed.set(packageInfo.name, tarball);
  console.log(`packed ${packageInfo.name}`);
}

writeConsumerProject(consumerDir, packed);

console.log("installing external consumer from packed tarballs");
run("pnpm", ["install", "--prefer-offline"], { cwd: consumerDir });

console.log("typechecking external consumer");
run("pnpm", ["typecheck"], { cwd: consumerDir });

console.log("building external consumer");
run("pnpm", ["build"], { cwd: consumerDir });

console.log(`release smoke passed in ${tempDir}`);

function writeConsumerProject(dir, tarballs) {
  mkdirSync(path.join(dir, "src"), { recursive: true });

  const coreTarball = pathToFileURL(tarballs.get("@mcp-frame/core")).href;
  const reactTarball = pathToFileURL(tarballs.get("@mcp-frame/react")).href;
  const testingTarball = pathToFileURL(tarballs.get("@mcp-frame/testing")).href;
  const rootPackage = JSON.parse(
    readFileSync(path.join(rootDir, "package.json"), "utf8")
  );
  const deps = rootPackage.devDependencies ?? {};

  writeJson(path.join(dir, "package.json"), {
    name: "mcp-frame-release-smoke-consumer",
    version: "0.0.0",
    private: true,
    type: "module",
    scripts: {
      build: "vite build",
      typecheck: "tsc -p tsconfig.json --noEmit"
    },
    dependencies: {
      "@mcp-frame/core": coreTarball,
      "@mcp-frame/react": reactTarball,
      "@mcp-frame/testing": testingTarball,
      react: installedVersion("react", deps.react ?? "^19.1.0"),
      "react-dom": installedVersion(
        "react-dom",
        deps["react-dom"] ?? "^19.1.0"
      )
    },
    devDependencies: {
      "@types/react": installedVersion(
        "@types/react",
        deps["@types/react"] ?? "^19.1.7"
      ),
      "@types/react-dom": installedVersion(
        "@types/react-dom",
        deps["@types/react-dom"] ?? "^19.1.6"
      ),
      typescript: installedVersion(
        "typescript",
        deps.typescript ?? "^5.8.3"
      ),
      vite: installedVersion("vite", deps.vite ?? "^6.3.5")
    },
    pnpm: {
      overrides: {
        "@mcp-frame/core": coreTarball
      }
    }
  });

  writeJson(path.join(dir, "tsconfig.json"), {
    compilerOptions: {
      target: "ES2022",
      useDefineForClassFields: true,
      lib: ["DOM", "DOM.Iterable", "ES2022"],
      allowJs: false,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      module: "ESNext",
      moduleResolution: "Bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx"
    },
    include: ["src"]
  });

  writeFileSync(
    path.join(dir, "index.html"),
    '<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n'
  );

  writeFileSync(
    path.join(dir, "src", "App.tsx"),
    `import { MCP_FRAME_METHODS, createJsonRpcNotification } from "@mcp-frame/core";
import { McpFrameProvider, useMcpToolCall, useToolResult } from "@mcp-frame/react";
import { todoToolResultFixture } from "@mcp-frame/testing";

type TodoResult = {
  tasks: Array<{
    id: string;
    title: string;
    done: boolean;
  }>;
};

const notification = createJsonRpcNotification(
  MCP_FRAME_METHODS.toolResult,
  todoToolResultFixture
);

function TodoFrame() {
  const result = useToolResult<TodoResult>();
  const callTool = useMcpToolCall();

  return (
    <main>
      <h1>Consumer smoke test</h1>
      <p>{notification.method}</p>
      {result.structuredContent?.tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => {
            void callTool("toggle_task", { id: task.id });
          }}
        >
          {task.done ? "Done" : "Todo"} - {task.title}
        </button>
      )) ?? <p>No tool result yet.</p>}
    </main>
  );
}

export default function App() {
  return (
    <McpFrameProvider>
      <TodoFrame />
    </McpFrameProvider>
  );
}
`
  );

  writeFileSync(
    path.join(dir, "src", "main.tsx"),
    `import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(<App />);
`
  );
}

function writeJson(filePath, value) {
  writeFileSync(`${filePath}`, `${JSON.stringify(value, null, 2)}\n`);
}

function installedVersion(packageName, fallback) {
  try {
    const packageJson = JSON.parse(
      readFileSync(
        path.join(rootDir, "node_modules", packageName, "package.json"),
        "utf8"
      )
    );

    return packageJson.version;
  } catch {
    return fallback;
  }
}
