// Reviewed temporary mitigation for GHSA-vfj7-8cjw-p6xm string-pattern parsing.
// Keep npm's advisory visible; this is not a claimed upstream patched release.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const file = resolve("node_modules/braces/lib/parse.js");
const expected = "e572166565f15fa6ad9865ae49d678218e32aabfd1b3720f6d0d43d39800d310";
const guard = "      // Monechai temporary bounded AST nesting mitigation.\n      if (stack.length >= 128) throw new RangeError('Pattern nesting exceeds reviewed limit');\n";
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const entries = Object.keys(lock.packages).filter(path => path.endsWith("node_modules/braces"));
if (!entries.some(path => existsSync(resolve(path)))) {
  console.log("No installed braces tooling (production-only install); mitigation not needed.");
  process.exit(0);
}
if (entries.length !== 1 || entries[0] !== "node_modules/braces") throw new Error("Review braces dependency layout before installing");
if (JSON.parse(readFileSync("node_modules/braces/package.json", "utf8")).version !== "3.0.3") throw new Error("Review/remove temporary braces mitigation for changed vendor version");
const source = readFileSync(file, "utf8"), original = source.split(guard).join("");
if (createHash("sha256").update(original).digest("hex") !== expected) throw new Error("Unexpected braces vendor source; refuse an unreviewed patch");
const target = "      stack.push(block);";
if (original.split(target).length !== 3) throw new Error("Unexpected braces parser structure");
writeFileSync(file, original.replaceAll(target, guard + target));
console.log("Applied reviewed braces3.0.3 string-pattern nesting mitigation; upstream audit remains open.");
