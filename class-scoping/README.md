# Named class-expression scoping reproduction

This fixture isolates a Webpack parser bug in minified Rolldown ESM output. It
uses `topLevelVar: false`, so it is independent of the scope-hoisting bug.

```sh
pnpm test:class-scoping
pnpm test:class-scoping:history
```

```text
                          Webpack 5.74   Webpack 5.90
Minified class name       FAIL          PASS
Preserved class name      PASS          PASS
```

## Failure shape

The source has a namespace import and a class static-property reference:

```js
import * as React from "./react.js";
class Fragment {
  static from() {
    return Fragment.empty;
  }
}
```

Minification can produce this valid ESM:

```js
import * as e from "./react.js";
var t = class e {
  static from() {
    return e.empty;
  }
};
```

Inside the class, `e` is the class expression's private self-binding, not the
import. Webpack 5.74 resolves it as the import anyway and reports a false
missing-export error. This is the source of errors such as `empty` or `none`
not being exported from React.

## Compatibility

| Webpack | Result |
| --- | --- |
| 5.74.0–5.83.1 | Fails |
| 5.84.0+ | Passes |

Representative Next.js releases reflect that boundary:

| Next.js | Bundled Webpack | Result |
| --- | --- | --- |
| 13.0.1 | 5.74.0 | Fails |
| 13.4.19 | 5.86.0 | Passes |
| 14.2.0 | 5.90.0 | Passes |

The history script also verifies that Rolldown 1.0.0, 1.0.3, 1.1.5, 1.2.5,
1.2.6, and 1.2.7 all emit the colliding class-name shape.

## Mitigation

Preserve class names in both minifier stages, alongside the scope-hoisting
mitigation:

```ts
export default {
  build: {
    rolldownOptions: {
      output: {
        topLevelVar: false,
        minify: {
          compress: { keepNames: { class: true, function: false } },
          mangle: { keepNames: { class: true, function: false } },
          codegen: false,
        },
      },
    },
  },
};
```

`codegen: false` retains Vite's ES-library whitespace and PURE-annotation
behavior. `output.keepNames` is not a substitute: it preserves the observable
`name` property but does not necessarily preserve a lexical self-reference.

For the conservative compatibility option, keep compression but disable
mangling:

```ts
minify: { compress: true, mangle: false, codegen: false }
```

Reserving one short identifier is not reliable; another name can collide.
Externalizing React is also insufficient—the failing shape already has React as
an external namespace import.

[Webpack 5.84.0](https://github.com/webpack/webpack/releases/tag/v5.84.0)
contains the parser fix. Useful references: [Webpack PR #17233](https://github.com/webpack/webpack/pull/17233),
[Oxc mangling](https://oxc.rs/docs/guide/usage/minifier/mangling.html),
[Rolldown `output.minify`](https://rolldown.rs/reference/OutputOptions.minify),
and [Vite build options](https://vite.dev/config/build-options).
