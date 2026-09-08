import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build as buildWithRolldown } from "vite";
import { build as buildWithRollup } from "vite-rollup";
import webpack from "webpack";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.join(root, "fixture");
const source = path.join(fixture, "index.js");
const dist = path.join(root, "dist");
const external = ["./external.js"];

function makeConfig(name, bundlerOptions) {
  return {
    configFile: false,
    logLevel: "silent",
    build: {
      outDir: fixture,
      emptyOutDir: false,
      target: "es2018",
      minify: "esbuild",
      lib: { entry: source, formats: ["es"], fileName: `${name}-bundle` },
      ...bundlerOptions,
    },
  };
}

async function consumeWithWebpack(name) {
  const directory = path.join(dist, name);
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
  assert.equal(stats.hasErrors(), false, stats.toString({ errors: true }));
  return spawnSync(process.execPath, [path.join(directory, "main.cjs")], {
    encoding: "utf8",
  });
}

const rolldownConfig = makeConfig("rolldown", {
  rolldownOptions: { external },
});
const rollupConfig = makeConfig("rollup", { rollupOptions: { external } });

await buildWithRolldown(rolldownConfig);
await buildWithRollup(rollupConfig);

const rolldownProcess = await consumeWithWebpack("rolldown");
const rollupProcess = await consumeWithWebpack("rollup");

assert.notEqual(rolldownProcess.status, 0);
assert.match(rolldownProcess.stderr, /ReferenceError: \w+ is not defined/);
assert.equal(rollupProcess.status, 0, rollupProcess.stderr);

console.log("Vite 8 / Rolldown -> Webpack 5.74: FAIL (unbound import)");
console.log("Vite 6 / Rollup   -> Webpack 5.74: PASS");
