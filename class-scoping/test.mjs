import path from "node:path";
import { fileURLToPath } from "node:url";

import { rolldown } from "rolldown";
import webpack574 from "webpack5-74-0";
import webpack590 from "webpack5-90-0";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const fixture = path.join(root, "fixture");
const source = path.join(fixture, "index.js");
const dist = path.join(root, "dist");
const external = ["./react.js"];

const minify = {
  compress: true,
  mangle: true,
  codegen: false,
};

const keepClassNames = {
  compress: { keepNames: { class: true, function: false } },
  mangle: { keepNames: { class: true, function: false } },
  codegen: false,
};

async function build(name, minifyOptions) {
  const bundle = await rolldown({ input: source, external });
  await bundle.write({
    file: path.join(fixture, `${name}-bundle.js`),
    format: "es",
    topLevelVar: false,
    minify: minifyOptions,
  });
  await bundle.close();
}

async function runWebpack(name, webpackVersion, webpack) {
  const compiler = webpack({
    mode: "production",
    target: "node",
    entry: path.join(fixture, `${name}-bundle.js`),
    optimization: { minimize: false },
    output: {
      path: path.join(dist, `${name}-webpack-${webpackVersion}`),
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

function printResult(name, webpack574Result, webpack590Result) {
  const status = (passed) => (passed ? "PASS" : "FAIL");
  console.log(
    `${name.padEnd(26)}${status(webpack574Result).padEnd(14)}${status(webpack590Result)}`,
  );
}

await build("minified", minify);
await build("keep-class-names", keepClassNames);

const minifiedWebpack574 = await runWebpack("minified", "5.74.0", webpack574);
const keepClassNamesWebpack574 = await runWebpack(
  "keep-class-names",
  "5.74.0",
  webpack574,
);
const minifiedWebpack590 = await runWebpack("minified", "5.90.0", webpack590);
const keepClassNamesWebpack590 = await runWebpack(
  "keep-class-names",
  "5.90.0",
  webpack590,
);

console.log(`${"".padEnd(26)}Webpack 5.74   Webpack 5.90`);
printResult("Minified class name", minifiedWebpack574, minifiedWebpack590);
printResult(
  "Preserved class name",
  keepClassNamesWebpack574,
  keepClassNamesWebpack590,
);
