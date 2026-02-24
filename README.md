# vvirtual-grid

> A Vue 3 component for rendering massive lists as a CSS grid with virtual scrolling.

[![npm version](https://img.shields.io/npm/v/vvirtual-grid)](https://www.npmjs.com/package/vvirtual-grid)
[![license](https://img.shields.io/npm/l/vvirtual-grid)](./LICENSE)

## Packages

This is a monorepo managed with [pnpm workspaces](https://pnpm.io/workspaces).

| Package | Description |
| --- | --- |
| [`core/`](./core) | The `vvirtual-grid` library — Vue component, Nuxt module, and utilities |
| [`docs/`](./docs) | Documentation site built with [Docus](https://docus.dev) |
| [`playground/`](./playground) | Local development playground |

## Getting Started

See the [documentation]() or the [core README](./core/README.md) for usage instructions.

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
4. Open a pull request — CI will run lint and tests automatically.

## Credits

Special thanks goes to

- [Sardor Astanov](https://github.com/sardor01)
- [Roc Wong](https://github.com/rocwang)

## License

[MIT](./LICENSE) © [astraldev](https://github.com/astraldev)
