import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build as buildWithRolldown } from "vite";
import { build as buildWithRollup } from "vite-rollup";
import webpack from "webpack";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "src", "index.js");
const dist = path.join(root, "dist");
const external = ["./external.js"];

function config(name, bundlerOptions) {
  return {
    configFile: false,
    logLevel: "silent",
    build: {
      outDir: path.join(dist, name),
      target: "es2018",
      minify: "esbuild",
      lib: { entry: source, formats: ["es"], fileName: "library" },
      ...bundlerOptions,
    },
  };
}

async function consumeWithWebpack(name) {
  const directory = path.join(dist, name);
  const entry = path.join(directory, "entry.js");
  fs.copyFileSync(
    path.join(root, "src", "external.js"),
    path.join(directory, "external.js"),
  );
  fs.writeFileSync(
    entry,
    'import { Second } from "./library.js"; globalThis.Second = Second;\n',
  );
  const compiler = webpack({
    mode: "production",
    target: "node",
    entry,
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

await buildWithRolldown(config("rolldown", { rolldownOptions: { external } }));
await buildWithRollup(config("rollup", { rollupOptions: { external } }));

const rolldown = await consumeWithWebpack("rolldown");
const rollup = await consumeWithWebpack("rollup");

assert.notEqual(rolldown.status, 0);
assert.match(rolldown.stderr, /ReferenceError: \w+ is not defined/);
assert.equal(rollup.status, 0, rollup.stderr);

console.log("Vite 8 / Rolldown -> Webpack 5.74: FAIL (unbound import)");
console.log("Vite 6 / Rollup   -> Webpack 5.74: PASS");
