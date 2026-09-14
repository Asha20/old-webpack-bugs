import { spawnSync } from "node:child_process";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { transform } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const fixture = path.join(root, "fixture");
const source = path.join(fixture, "index.js");
const external = [path.join(fixture, "external.js")];
const outputRoot = "/tmp/rolldown-scope-hoisting-history";
const generatedEntries = [];

const webpackVersions = [
  ["5.74.0", "webpack5-74-0"],
  ["5.86.0", "webpack5-86-0"],
  ["5.87.0", "webpack5-87-0"],
  ["5.88.2", "webpack5-88-2"],
  ["5.89.0", "webpack5-89-0"],
  ["5.90.0", "webpack5-90-0"],
];

const rolldownVersions = [
  ["1.0.0", "rolldown1-0-0"],
  ["1.0.3", "rolldown1-0-3"],
  ["1.1.5", "rolldown1-1-5"],
  ["1.2.5", "rolldown1-2-5"],
  ["1.2.6", "rolldown1-2-6"],
  ["1.2.7", "rolldown"],
];

function mergeDeclarations() {
  return {
    name: "merge-declarations",
    async renderChunk(code) {
      const result = await transform(code, { minifySyntax: true });
      return { code: result.code };
    },
  };
}

async function build(rolldown, file) {
  const bundle = await rolldown({
    input: source,
    external,
    plugins: [mergeDeclarations()],
  });
  await bundle.write({
    file,
    format: "es",
    topLevelVar: true,
  });
  await bundle.close();
}

async function runs(entry, version, packageName) {
  const { default: webpack } = await import(packageName);
  const compiler = webpack({
    mode: "production",
    target: "node",
    entry,
    optimization: { minimize: false },
    output: {
      path: path.join(outputRoot, `webpack-${version}`),
      filename: "main.cjs",
    },
  });
  const stats = await new Promise((resolve, reject) =>
    compiler.run((error, result) => {
      compiler.close(() => {});
      error ? reject(error) : resolve(result);
    }),
  );
  if (stats.hasErrors()) return false;
  return (
    spawnSync(process.execPath, [path.join(outputRoot, `webpack-${version}`, "main.cjs")], {
      encoding: "utf8",
    }).status === 0
  );
}

try {
  const { rolldown: currentRolldown } = await import("rolldown");
  const currentEntry = path.join(fixture, ".history-rolldown-1.2.7.js");
  generatedEntries.push(currentEntry);
  await build(currentRolldown, currentEntry);

  console.log("Webpack version  topLevelVar: true fixture");
  for (const [version, packageName] of webpackVersions) {
    console.log(`${version.padEnd(17)}${(await runs(currentEntry, version, packageName)) ? "PASS" : "FAIL"}`);
  }

  console.log("\nRolldown version  Webpack 5.74 runtime");
  for (const [version, packageName] of rolldownVersions) {
    const { rolldown } = await import(packageName);
    const entry = path.join(fixture, `.history-rolldown-${version}.js`);
    generatedEntries.push(entry);
    await build(rolldown, entry);
    console.log(`${version.padEnd(18)}${(await runs(entry, version, "webpack5-74-0")) ? "PASS" : "FAIL"}`);
  }
} finally {
  await Promise.all(generatedEntries.map((entry) => unlink(entry).catch(() => {})));
}
