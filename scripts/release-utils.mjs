import { readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const publishablePackages = [
  { name: "@mcp-frame/core", dir: "packages/core" },
  { name: "@mcp-frame/react", dir: "packages/react" },
  { name: "@mcp-frame/testing", dir: "packages/testing" },
  { name: "create-mcp-frame", dir: "packages/create-mcp-frame" }
];

export const smokePackages = publishablePackages.filter((packageInfo) =>
  packageInfo.name.startsWith("@mcp-frame/")
);

export function packPackage(rootDir, packageInfo, outDir) {
  const before = new Set(
    readdirSync(outDir).filter((entry) => entry.endsWith(".tgz"))
  );

  run("pnpm", ["pack", "--pack-destination", outDir], {
    cwd: path.join(rootDir, packageInfo.dir)
  });

  const created = readdirSync(outDir)
    .filter((entry) => entry.endsWith(".tgz"))
    .filter((entry) => !before.has(entry));

  if (created.length !== 1) {
    throw new Error(
      `Expected exactly one tarball for ${packageInfo.name}, found ${created.length}.`
    );
  }

  return path.join(outDir, created[0]);
}

export function inspectPackedPackage(tarball) {
  const manifestOutput = run("tar", ["-xOf", tarball, "package/package.json"], {
    capture: true
  });
  const entriesOutput = run("tar", ["-tf", tarball], { capture: true });

  return {
    manifest: JSON.parse(manifestOutput),
    entries: entriesOutput.trim().split("\n")
  };
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : options.quiet ? "ignore" : "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const rendered = [command, ...args].join(" ");
    throw new Error(`Command failed (${result.status}): ${rendered}`);
  }

  if (options.capture) {
    return result.stdout;
  }

  return "";
}
