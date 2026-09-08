# Minimal Rolldown-versus-Rollup reproduction

The same 290-byte React source is built as an ESM library by:

- Vite 8.1.5 with Rolldown 1.2.7
- Vite 6.4.1 with Rollup 4.54.0

Both builds target ES2018, externalize React and ReactDOM, and use esbuild
minification. Webpack 5.74 then consumes each library with production module
concatenation enabled.

## Run

```sh
pnpm install
pnpm test
```

Expected output:

```text
Vite 8 / Rolldown -> Webpack 5.74: FAIL (unbound import)
Vite 6 / Rollup   -> Webpack 5.74: PASS
```

Webpack compiles both generated libraries successfully. Evaluating the bundle
made from Rolldown's output then throws because the generated alias for React's
`forwardRef` import is undefined; the bundle made from Rollup's output runs.

The source combines the three ingredients needed to retain the problematic
output shape: a private field lowered for ES2018, two `forwardRef` exports in
one declaration, and a ReactDOM reference. Rolldown emits its imports before
the lowered helpers and keeps the two components in a comma-chained `var`
statement. Webpack rewrites the first imported `forwardRef` use but leaves the
second alias unbound. Rollup orders and deconflicts the same symbols
differently, so Webpack handles its output correctly.

Generated output is written to `dist/` and is intentionally not checked in.

## Impact

Rolldown's output is valid ESM, so the incorrect transformation is ultimately
an old Webpack bug. It is nevertheless a compatibility problem for libraries:
library authors cannot require all consumers to upgrade the Webpack version
embedded in their application framework. In practice, affected Next.js
consumers cannot safely use library bundles with this output shape.

Emitting the Rollup-compatible symbol or declaration shape would avoid the
downstream failure. Disabling Webpack's `concatenateModules` optimization also
avoids it, but that requires consumer configuration and disables an optimization
for the whole application.

The same failure has been observed with Rolldown 1.0.0, 1.0.3, 1.1.5, 1.2.5,
1.2.6, and 1.2.7.

## Historical Next.js validation

The Rolldown output was also consumed with the actual Webpack build selected by
representative published Next.js releases. This is supporting evidence rather
than part of the minimal reproduction, so the historical Next packages are not
dependencies of this fixture.

| Next.js | Default Webpack | Result |
| --- | --- | --- |
| 10.0.0 | 4.44.1 | Pass |
| 10.2.3 | 4.44.1 | Pass |
| 11.0.0 | 5.39.0 | Runtime failure |
| 11.1.4 | 5.51.1 | Runtime failure |
| 12.0.0 | 5.60.0 | Runtime failure |
| 12.3.4 | 5.74.0 | Runtime failure |
| 13.0.0 | 5.74.0 | Runtime failure |
| 13.4.19 | 5.86.0 | Runtime failure |
| 13.5.11 | 5.86.0 | Runtime failure |
| 14.0.0 | 5.86.0 | Runtime failure |
| 14.1.4 | 5.86.0 | Runtime failure |
| 14.2.0 | 5.90.0 | Pass |
| 15.0.0 | 5.90.0 | Pass |
| 16.0.0 | 5.98.0 | Pass |

Every failure above was the same generated-code failure: an imported alias was
left unbound and caused a `ReferenceError`. The first tested passing release
after the affected range is Next.js 14.2.0, which moved from Webpack 5.86 to
5.90.
