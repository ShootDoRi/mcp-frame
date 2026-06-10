import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { packPackage, publishablePackages, run } from "./release-utils.mjs";

const rootDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const outDir = path.join(rootDir, ".release", "tarballs");

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const packageInfo of publishablePackages) {
  const tarball = packPackage(rootDir, packageInfo, outDir);
  console.log(`packed ${packageInfo.name}: ${path.relative(rootDir, tarball)}`);
}

const tarballs = readdirSync(outDir).filter((entry) => entry.endsWith(".tgz"));
if (tarballs.length !== publishablePackages.length) {
  throw new Error(
    `Expected ${publishablePackages.length} tarballs, found ${tarballs.length}.`
  );
}

run("pnpm", ["--version"], { cwd: rootDir, quiet: true });
console.log(`release tarballs are in ${path.relative(rootDir, outDir)}`);
