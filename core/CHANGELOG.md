# Changelog

## v1.2.1

[compare changes](https://github.com/astraldev/vvirtual-grid/compare/v1.1.6...v1.2.1)

### 🚀 Enhancements

- Expose low-level position, element and order primitives ([0f845b1](https://github.com/astraldev/vvirtual-grid/commit/0f845b1))
- **grid:** ⚠️  Drop ramda, keep loaded pages internal and compare items by id ([6260a0d](https://github.com/astraldev/vvirtual-grid/commit/6260a0d))

### 🔥 Performance

- Improve performance of accumulateAllItems function to reduce overhead due to array modifications triggering gc ([03956a1](https://github.com/astraldev/vvirtual-grid/commit/03956a1))
- Make the scroll path linear and stop re-creating unchanged items ([5607b67](https://github.com/astraldev/vvirtual-grid/commit/5607b67))

### 🩹 Fixes

- Expose allItems, ready and measurement on the first render ([a22033f](https://github.com/astraldev/vvirtual-grid/commit/a22033f))

### 💅 Refactors

- Move the primitives out of the component into plain functions ([7ac32f2](https://github.com/astraldev/vvirtual-grid/commit/7ac32f2))
- **primitives:** Take one object of named arguments ([986c429](https://github.com/astraldev/vvirtual-grid/commit/986c429))
- **primitives:** Cut to four functions with reusable queries, emit events ([e2d5229](https://github.com/astraldev/vvirtual-grid/commit/e2d5229))
- **slots:** Drop undocumented total slot prop ([96e7386](https://github.com/astraldev/vvirtual-grid/commit/96e7386))

### 📖 Documentation

- Restructure the docs site and upgrade Docus ([6be1088](https://github.com/astraldev/vvirtual-grid/commit/6be1088))
- Rewrite guides as procedures and document the new primitives ([7e7f410](https://github.com/astraldev/vvirtual-grid/commit/7e7f410))
- Add Floating UI and ARIA demos, benchmarks page, and review fixes ([5d54387](https://github.com/astraldev/vvirtual-grid/commit/5d54387))
- State the 1.2.0 performance gain over 1.1.6 in the changelog and README ([fbbf79d](https://github.com/astraldev/vvirtual-grid/commit/fbbf79d))
- State the supported scope and point the docs at netlify ([f44ac5f](https://github.com/astraldev/vvirtual-grid/commit/f44ac5f))
- Rewrite guides and reference for 1.2.0 ([c2c728f](https://github.com/astraldev/vvirtual-grid/commit/c2c728f))
- Update the first-render figures in the introduction ([d44052d](https://github.com/astraldev/vvirtual-grid/commit/d44052d))
- Scroll to the focused item only when it leaves the view ([16c96a3](https://github.com/astraldev/vvirtual-grid/commit/16c96a3))
- **todo:** Record the RxJS 9 migration research ([41fc9a7](https://github.com/astraldev/vvirtual-grid/commit/41fc9a7))

### 📦 Build

- Mark the package side-effect free and add a primitives entry ([e79f1ec](https://github.com/astraldev/vvirtual-grid/commit/e79f1ec))
- **core:** Target ES2020 and record the smaller bundle ([6ea8c93](https://github.com/astraldev/vvirtual-grid/commit/6ea8c93))

### 🏡 Chore

- Add profiler for better performance analysis ([aaa2f05](https://github.com/astraldev/vvirtual-grid/commit/aaa2f05))
- Use better benchmarks labels ([6268c12](https://github.com/astraldev/vvirtual-grid/commit/6268c12))
- **release:** V1.2.0 ([a0b9968](https://github.com/astraldev/vvirtual-grid/commit/a0b9968))
- Keep the pnpm store inside the workspace ([ddda363](https://github.com/astraldev/vvirtual-grid/commit/ddda363))
- Remove manual publishing ([e323b22](https://github.com/astraldev/vvirtual-grid/commit/e323b22))

#### ⚠️ Breaking Changes

- **grid:** ⚠️  Drop ramda, keep loaded pages internal and compare items by id ([6260a0d](https://github.com/astraldev/vvirtual-grid/commit/6260a0d))

### ❤️ Contributors

- Ekure Edem ([@astraldev](https://github.com/astraldev))

## v1.2.0

[compare changes](https://github.com/astraldev/vvirtual-grid/compare/v1.1.6...v1.2.0)

### 🚀 Enhancements

- `vvirtual-grid/primitives` gives the rectangle, row and column of any item, rendered or not, through reusable query objects: `getItemRect`, `getItemCell`, `getIndexByCell` and `createItemTracker`
- `<VirtualGrid>` exposes `measurement` and emits `render`, `viewport-scroll` and `layout-change`
- The `getItemId` prop returns a unique identifier of an item. Items with the same identifier are not rendered again when their page is loaded again

### ⚠️ Breaking Changes

- `<VirtualGrid>` no longer exposes `allItems`, and `pipeline()` no longer returns `allItems$`. The grid keeps loaded pages in an internal map
- The grid no longer compares item values in depth. An item loaded again as a new, equal object is rendered again, unless `getItemId` is set

### 🩹 Fixes

- Resolved `undefined` for `ready` and `measurement` on a template ref read before the parent rendered again. They are now set on the first render

### 🔥 Performance

- Scrolling a list of 1,000,000 items by one row per event takes about 1 ms for 20 events, down from about 2.9 s ([7aab6fe](https://github.com/astraldev/vvirtual-grid/commit/7aab6fe))

### 📦 Build

- The package is marked side-effect free ([6644e7b](https://github.com/astraldev/vvirtual-grid/commit/6644e7b))
- Ramda is no longer a runtime dependency, and the build targets ES2020, where 1.1.6 targeted ES2015. The minified, gzipped entry point is 13.8 KB, down from 17.1 KB

### 📖 Documentation

- New pages for the primitives, accessibility, popovers, sizing and performance

### ❤️ Contributors

- Ekure Edem ([@astraldev](https://github.com/astraldev))

## v1.1.6

[compare changes](https://github.com/astraldev/vvirtual-grid/compare/v1.1.5...v1.1.6)

### 🩹 Fixes

- **pipeline:** Ensure that data is properly refreshed and recomputed when length is changed ([8138131](https://github.com/astraldev/vvirtual-grid/commit/8138131))

### 🏡 Chore

- Include benchmarking ([14c8da9](https://github.com/astraldev/vvirtual-grid/commit/14c8da9))

### ❤️ Contributors

- Ekure Edem ([@astraldev](https://github.com/astraldev))

## v1.1.5

[compare changes](https://github.com/astraldev/vvirtual-grid/compare/v1.1.4...v1.1.5)

### 🩹 Fixes

- **pipeline:** Fix issue with corrupt lists due to dynamic page size changes ([75a87da](https://github.com/astraldev/vvirtual-grid/commit/75a87da))

### ❤️ Contributors

- Ekure Edem ([@astraldev](https://github.com/astraldev))

## v1.1.4

[compare changes](https://github.com/astraldev/vvirtual-grid/compare/v1.1.3...v1.1.4)

### 🩹 Fixes

- Resolve placeholder glitching issue ([9fb7afa](https://github.com/astraldev/vvirtual-grid/commit/9fb7afa))

### ❤️ Contributors

- Ekure Edem ([@astraldev](https://github.com/astraldev))

## v1.1.3

[compare changes](https://github.com/astraldev/vvirtual-grid/compare/v1.1.2...v1.1.3)

### 🏡 Chore

- Switch from unbuild to tsdown ([2e44a7f](https://github.com/astraldev/vvirtual-grid/commit/2e44a7f))

### ❤️ Contributors

- Ekure Edem ([@astraldev](https://github.com/astraldev))

## v1.1.2

[compare changes](https://github.com/astraldev/vvirtual-grid/compare/v1.1.1...v1.1.2)

### 🚀 Enhancements

- Make page provider not require async functions ([bf5a485](https://github.com/astraldev/vvirtual-grid/commit/bf5a485))

### 🩹 Fixes

- Resolve issue with package types conflicting user with builds ([5f3f581](https://github.com/astraldev/vvirtual-grid/commit/5f3f581))
- Resolve peer dependency issues for vue ([52036b0](https://github.com/astraldev/vvirtual-grid/commit/52036b0))

### 🤖 CI

- Change postinstall to prepare script ([8c205cb](https://github.com/astraldev/vvirtual-grid/commit/8c205cb))
- Remove prepare script for playground ([3a07fbc](https://github.com/astraldev/vvirtual-grid/commit/3a07fbc))

### ❤️ Contributors

- Ekure Edem

## v1.1.1

[compare changes](https://github.com/astraldev/vvirtual-grid/compare/legacy...v1.2.0)

### 🚀 Enhancements

- SSR support + dedicated documentation page ([#1](https://github.com/astraldev/vvirtual-grid/pull/1))

### 📖 Documentation

- Update documentation and CI files ([8890d4d](https://github.com/astraldev/vvirtual-grid/commit/8890d4d))

### ❤️ Contributors

- Ekure Edem

## v1.1.0

[compare changes](https://github.com/astraldev/vvirtual-grid/compare/legacy...v1.1.0)

### 🚀 Enhancements

- Init ssr implementation ([c584b30](https://github.com/astraldev/vvirtual-grid/commit/c584b30))
- Enable query support for playground ([711a903](https://github.com/astraldev/vvirtual-grid/commit/711a903))
- Move probe to last when rendering ssr and switch to top once dom is loaded ([5331609](https://github.com/astraldev/vvirtual-grid/commit/5331609))
- Update pkg json to include missing dep ([067c089](https://github.com/astraldev/vvirtual-grid/commit/067c089))
- Add composable for creating a pageProvider ([1d05596](https://github.com/astraldev/vvirtual-grid/commit/1d05596))

### 💅 Refactors

- Migrate to Nuxt module build system, replace Jest, and add oxlint/oxfmt for linting and formatting. ([87f2eb1](https://github.com/astraldev/vvirtual-grid/commit/87f2eb1))

### 📖 Documentation

- Include documentation pages ([f1d643e](https://github.com/astraldev/vvirtual-grid/commit/f1d643e))

### 🏡 Chore

- Initial refactor ([9e42c03](https://github.com/astraldev/vvirtual-grid/commit/9e42c03))
- Init monorepo structure ([c5c29a8](https://github.com/astraldev/vvirtual-grid/commit/c5c29a8))
- Cleanup and ensure previous tests pass ([f82b502](https://github.com/astraldev/vvirtual-grid/commit/f82b502))
- Remove nuxt integration folder + switch playground to fully nuxt ([bd078e7](https://github.com/astraldev/vvirtual-grid/commit/bd078e7))
- Dirty ssr commit ([31ac41d](https://github.com/astraldev/vvirtual-grid/commit/31ac41d))
- Split tests ([b264d71](https://github.com/astraldev/vvirtual-grid/commit/b264d71))
- Add commit lints ([3e6e2b8](https://github.com/astraldev/vvirtual-grid/commit/3e6e2b8))
- Cleanup documentation ([f054b8f](https://github.com/astraldev/vvirtual-grid/commit/f054b8f))

### 🤖 CI

- Attempt fixing of CI workflow + documentation update ([acb27a5](https://github.com/astraldev/vvirtual-grid/commit/acb27a5))

### ❤️ Contributors

- Ekure Edem
