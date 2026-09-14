# Scope-hoisting reproduction

This fixture isolates a Webpack module-concatenation bug in Rolldown ESM output.
It builds the same lowered source with Rolldown (`topLevelVar: true` and
`false`) and Rollup, then compiles and executes each output with Webpack.

```sh
pnpm test:scope-hoisting
pnpm test:scope-hoisting:history
```

```text
                              Webpack 5.74   Webpack 5.90
Rolldown (topLevelVar: true)  FAIL          PASS
Rolldown (topLevelVar: false) PASS          PASS
Rollup                        PASS          PASS
```

With `topLevelVar: true`, Rolldown and the shared esbuild syntax-minification
pass combine a class, storage, and two imported-function calls into one
comma-chained `var` declaration. Old Webpack drops the imported `wrap`
dependency during module concatenation but retains calls to it, causing a
runtime `ReferenceError`. The output is valid ESM; Webpack performs the invalid
transformation.

## Compatibility

The history script executes the generated bundle, rather than treating a
successful compilation as a pass.

| Webpack | Result |
| --- | --- |
| 5.74.0–5.89.0 | Runtime failure |
| 5.90.0+ | Pass |

Representative Next.js releases follow the same boundary:

| Next.js | Bundled Webpack | Result |
| --- | --- | --- |
| 13.0.0 | 5.74.0 | Runtime failure |
| 14.1.4 | 5.86.0 | Runtime failure |
| 14.2.0 | 5.90.0 | Pass |

Rolldown 1.0.0, 1.0.3, 1.1.5, 1.2.5, 1.2.6, and 1.2.7 all reproduce the
failure with Webpack 5.74.

## Mitigation

Set `topLevelVar: false` for library output:

```ts
export default {
  build: {
    rolldownOptions: {
      output: { topLevelVar: false },
    },
  },
};
```

This does not fix the separate named-class parser bug in
[`class-scoping/`](../class-scoping/README.md); libraries supporting old
Webpack versions need both mitigations. Disabling `concatenateModules` also
works, but requires every consumer to change application-wide configuration.

Webpack 5.90 includes the relevant [inner-graph-for-classes
fix](https://github.com/webpack/webpack/releases/tag/v5.90.0). See also
[Rolldown output options](https://rolldown.rs/reference/Interface.OutputOptions)
and [Vite build options](https://vite.dev/config/build-options).
