import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { transform } from "esbuild";
import { rolldown } from "rolldown";
import { rollup } from "rollup";
import webpack574 from "webpack5-74-0";
import webpack590 from "webpack5-90-0";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const fixture = path.join(root, "fixture");
const source = path.join(fixture, "index.js");
const dist = path.join(root, "dist");
const external = ["./external.js"];

function mergeDeclarations() {
  return {
    name: "merge-declarations",
    async renderChunk(code) {
      const result = await transform(code, { minifySyntax: true });
      return { code: result.code };
    },
  };
}

async function build(bundler, name, outputOptions = {}) {
  const bundle = await bundler({
    input: source,
    external,
    plugins: [mergeDeclarations()],
  });
  await bundle.write({
    file: path.join(fixture, `${name}-bundle.js`),
    format: "es",
    ...outputOptions,
  });
  await bundle.close();
}

async function runWebpack(name, webpackVersion, webpack) {
  const directory = path.join(dist, `${name}-webpack-${webpackVersion}`);
  const compiler = webpack({
    mode: "production",
    target: "node",
    entry: path.join(fixture, `${name}-bundle.js`),
    optimization: { minimize: false },
    output: { path: directory, filename: "main.cjs" },
  });
  const stats = await new Promise((resolve, reject) =>
    compiler.run((error, result) => {
      compiler.close(() => {});
      error ? reject(error) : resolve(result);
    }),
  );
  if (stats.hasErrors()) return false;
  const result = spawnSync(process.execPath, [path.join(directory, "main.cjs")], {
    encoding: "utf8",
  });
  return result.status === 0;
}

function printResult(name, webpack574Result, webpack590Result) {
  const status = (passed) => (passed ? "PASS" : "FAIL");
  console.log(
    `${name.padEnd(30)}${status(webpack574Result).padEnd(14)}${status(webpack590Result)}`,
  );
}

await build(rolldown, "rolldown", { topLevelVar: true });
await build(rolldown, "rolldown-top-level-var-false", {
  topLevelVar: false,
});
await build(rollup, "rollup");

const rolldownWebpack574 = await runWebpack("rolldown", "5.74.0", webpack574);
const rolldownTopLevelVarFalseWebpack574 = await runWebpack(
  "rolldown-top-level-var-false",
  "5.74.0",
  webpack574,
);
const rollupWebpack574 = await runWebpack("rollup", "5.74.0", webpack574);
const rolldownWebpack590 = await runWebpack("rolldown", "5.90.0", webpack590);
const rolldownTopLevelVarFalseWebpack590 = await runWebpack(
  "rolldown-top-level-var-false",
  "5.90.0",
  webpack590,
);
const rollupWebpack590 = await runWebpack("rollup", "5.90.0", webpack590);

console.log(`${"".padEnd(30)}Webpack 5.74   Webpack 5.90`);
printResult("Rolldown (topLevelVar: true)", rolldownWebpack574, rolldownWebpack590);
printResult(
  "Rolldown (topLevelVar: false)",
  rolldownTopLevelVarFalseWebpack574,
  rolldownTopLevelVarFalseWebpack590,
);
printResult("Rollup", rollupWebpack574, rollupWebpack590);
