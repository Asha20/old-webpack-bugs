import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { transform } from "esbuild";
import { rolldown } from "rolldown";
import { rollup } from "rollup";
import webpack574 from "webpack5-74-0";
import webpack590 from "webpack5-90-0";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.join(root, "fixture");
const source = path.join(fixture, "index.js");
const dist = path.join(root, "dist");
const external = ["./external.js"];

function minifyPlugin() {
  return {
    name: "shared-esbuild-minify",
    async renderChunk(code) {
      const result = await transform(code, {
        format: "esm",
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: false,
        treeShaking: true,
      });
      return { code: result.code };
    },
  };
}

async function build(bundler, name, outputOptions = {}) {
  const bundle = await bundler({
    input: source,
    external,
    plugins: [minifyPlugin()],
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
  assert.equal(stats.hasErrors(), false, stats.toString({ errors: true }));
  return spawnSync(process.execPath, [path.join(directory, "main.cjs")], {
    encoding: "utf8",
  });
}

await build(rolldown, "rolldown", { topLevelVar: true });
await build(rollup, "rollup");

const rolldownWebpack574 = await runWebpack("rolldown", "5.74.0", webpack574);
const rollupWebpack574 = await runWebpack("rollup", "5.74.0", webpack574);
const rolldownWebpack590 = await runWebpack("rolldown", "5.90.0", webpack590);
const rollupWebpack590 = await runWebpack("rollup", "5.90.0", webpack590);

assert.notEqual(rolldownWebpack574.status, 0);
assert.match(rolldownWebpack574.stderr, /ReferenceError: \w+ is not defined/);
assert.equal(rollupWebpack574.status, 0, rollupWebpack574.stderr);
assert.equal(rolldownWebpack590.status, 0, rolldownWebpack590.stderr);
assert.equal(rollupWebpack590.status, 0, rollupWebpack590.stderr);

console.log("          Webpack 5.74  Webpack 5.90");
console.log("Rolldown  FAIL          PASS");
console.log("Rollup    PASS          PASS");
