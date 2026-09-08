# Minimal Rolldown-versus-Rollup reproduction

The same small, already-lowered ESM source is built directly by:

- Rolldown 1.2.7 with `topLevelVar: true`
- Rollup 4.54.0

Both builds externalize the same one-function local module and run the same
esbuild `renderChunk` pass. The esbuild options match Vite's ES-library
minification behavior. Webpack 5.74 and 5.90 then consume each library together
with the external module, using production module concatenation.

Vite 8 sets `topLevelVar: true` when it invokes Rolldown. That option is the
smallest isolated difference needed to reproduce the problematic output shape;
direct Rolldown without it produces a bundle that Webpack 5.74 handles.

## Run

```sh
pnpm install
pnpm test
```

Expected output:

```text
          Webpack 5.74  Webpack 5.90
Rolldown  FAIL          PASS
Rollup    PASS          PASS
```

With Webpack 5.74, evaluating the bundle made from Rolldown's output then throws
because the generated alias for the imported function is undefined; the bundle
made from Rollup's output runs. Webpack 5.90 runs both outputs successfully.

The source combines the ingredients needed to retain the problematic output
shape: a lowered class-field helper and two calls to an imported function.
Rolldown's `topLevelVar` output, after the shared esbuild pass, combines the
storage, class, and calls into one comma-chained `var` statement. Webpack leaves
the imported alias unbound while concatenating the modules. Rollup preserves
separate declaration kinds, so esbuild does not create that chain and Webpack
handles its output correctly.

The two library builds are emitted beside the tracked files in `fixture/` as
ignored `rolldown-bundle.js` and `rollup-bundle.js` files. Webpack output is
written to the ignored `dist/` directory.

## Impact

Rolldown's output is valid ESM, so the incorrect transformation is ultimately
an old Webpack bug. The minimized example uses a generic imported function, but
the real failure was found in React library output using `forwardRef`. It is
therefore a compatibility problem for libraries: authors cannot require all
consumers to upgrade the Webpack version embedded in their application
framework. In practice, affected Next.js consumers cannot safely use library
bundles with this output shape.

Emitting the Rollup-compatible symbol or declaration shape would avoid the
downstream failure. Disabling Webpack's `concatenateModules` optimization also
avoids it, but that requires consumer configuration and disables an optimization
for the whole application.

The same failure has been observed with Rolldown 1.0.0, 1.0.3, 1.1.5, 1.2.5,
1.2.6, and 1.2.7.

## Historical Next.js validation

The original React library output was also consumed with the actual Webpack
build selected by representative published Next.js releases. This is
supporting evidence rather than part of the minimal reproduction, so the
historical Next packages are not dependencies of this fixture.

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
