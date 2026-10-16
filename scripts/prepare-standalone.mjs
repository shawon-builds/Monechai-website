// Next traces server dependencies but does not copy static/public assets.
// Keep npm start usable directly after npm run build, as in the Docker artifact.
import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const standalone = resolve(".next/standalone");
if (!existsSync(resolve(standalone, "server.js"))) {
  throw new Error("Build the standalone server before preparing its assets.");
}
for (const [source, destination] of [
  ["public", "public"],
  [".next/static", ".next/static"],
]) {
  const target = resolve(standalone, destination);
  rmSync(target, { recursive: true, force: true });
  cpSync(resolve(source), target, { recursive: true });
}
console.log("Standalone public and static assets prepared.");
