# Old Webpack compatibility reproductions

This repository contains two separate minimal reproductions for old Webpack
versions consuming Rolldown-generated ESM:

- [`scope-hoisting/`](scope-hoisting/README.md) reproduces a runtime failure in
  Webpack's module concatenation when Rolldown uses `topLevelVar: true`.
- [`class-scoping/`](class-scoping/README.md) reproduces a compile-time failure
  when a minified named class expression shadows an import binding.

The two bugs are independent.

## Run

```sh
pnpm install
pnpm test
```

Each reproduction can also be run on its own:

```sh
pnpm test:scope-hoisting
pnpm test:class-scoping
```

Or you can run the tests against historical versions of Webpack:

```sh
pnpm test:scope-hoisting:history
pnpm test:class-scoping:history
```
