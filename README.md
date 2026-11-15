# vvirtual-grid

> A Vue 3 component that renders a large list as a CSS grid and keeps only the items near the viewport in the page.

[![npm version](https://img.shields.io/npm/v/vvirtual-grid)](https://www.npmjs.com/package/vvirtual-grid)
[![license](https://img.shields.io/npm/l/vvirtual-grid)](./LICENSE)

## Scope

`vvirtual-grid` handles over a million items. The [benchmarks](./benchmarks)
render 1,000,000 items in one grid, and the page holds about 200 item elements
at a time.

It is a performant grid and nothing else. It is not a replacement for a
general-purpose virtualizer such as [TanStack Virtual](https://tanstack.com/virtual)
or `vue-virtual-scroller`, which also handle lists, tables and dynamic content.

- Grids only. Not lists, tables, feeds or masonry.
- Static items only. Every item must have the same width and height, so items
  whose size depends on their content are out of scope. The size may change
  with the viewport, but not per item.

## Packages

This is a monorepo managed with [pnpm workspaces](https://pnpm.io/workspaces).

| Package | Description |
| --- | --- |
| [`core/`](./core) | The `vvirtual-grid` library: Vue component, Nuxt module and utilities |
| [`docs/`](./docs) | Documentation site built with [Docus](https://docus.dev) |
| [`playground/`](./playground) | Local development playground |

## Getting Started

See the [documentation](https://vvirtual-grid.netlify.app) or the [core README](./core/README.md) for usage instructions.

## Development

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 20
- [pnpm](https://pnpm.io) ≥ 10

### Setup

```sh
pnpm install
```

### Commands

| Command | Description |
| --- | --- |
| `pnpm --filter=vvirtual-grid run build` | Build the library |
| `pnpm --filter=vvirtual-grid run lint` | Lint the library source |
| `pnpm run test` | Run all tests |
| `pnpm --filter=playground run dev` | Start the Vue playground |
| `pnpm --filter=docs run dev` | Start the documentation site locally |

## Contributing

1. Fork the repo and create a branch from `main`.
2. Make your changes in `core/src/` or `core/integrations/`.
3. Add or update tests as needed.
4. Open a pull request. CI runs lint and tests automatically.

## Credits

Special thanks go to

- [Sardor Astanov](https://github.com/sardor01)
- [Roc Wong](https://github.com/rocwang)

## License

[MIT](./LICENSE) © [astraldev](https://github.com/astraldev)
