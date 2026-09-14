import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const entry = path.join(root, "fixture", "minified-bundle.js");
const outputRoot = "/tmp/rolldown-class-scoping-history";

const webpackVersions = [
  ["5.74.0", "webpack5-74-0"],
  ["5.82.1", "webpack5-82-1"],
  ["5.83.1", "webpack5-83-1"],
  ["5.84.0", "webpack5-84-0"],
  ["5.84.1", "webpack5-84-1"],
  ["5.85.1", "webpack5-85-1"],
  ["5.86.0", "webpack5-86-0"],
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

const source = `
  import * as React from "./react.js";
  class Fragment { static from() { return Fragment.empty; } }
  Fragment.empty = [];
  console.log(React.createElement, Fragment.from());
`;

const minify = { compress: true, mangle: true, codegen: false };

async function webpackCompiles(version, packageName) {
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
  return !stats.hasErrors();
}

async function emitsCollision(version, packageName) {
  const { rolldown } = await import(packageName);
  const bundle = await rolldown({
    input: "entry",
    external: ["./react.js"],
    plugins: [
      {
        name: "fixture-source",
        resolveId(id) {
          return id === "entry" ? id : null;
        },
        load(id) {
          return id === "entry" ? source : null;
        },
      },
    ],
  });
  const { output } = await bundle.generate({
    format: "es",
    topLevelVar: false,
    minify,
  });
  await bundle.close();
  return /var t = class e/.test(output[0].code);
}

console.log("Webpack version  Minified fixture");
for (const [version, packageName] of webpackVersions) {
  console.log(`${version.padEnd(17)}${(await webpackCompiles(version, packageName)) ? "PASS" : "FAIL"}`);
}

console.log("\nRolldown version  Emits colliding class name");
for (const [version, packageName] of rolldownVersions) {
  console.log(`${version.padEnd(18)}${(await emitsCollision(version, packageName)) ? "YES" : "NO"}`);
}
