# UI workshop

The shared React library and Storybook review environment for the Figma-to-React
proof of concept. This package is private and is installed from local archives.

## Pilot design

[Figma component selection](https://www.figma.com/design/UUB3GeBjzTQFswVB4p7uQf/figma-to-react-poc?node-id=9-330)

- File: `UUB3GeBjzTQFswVB4p7uQf`
- Node: `9:330`

The current Button is Storybook's setup sample. Implementing the selected Figma
design is a separate step after the workshop and consumer are ready.

## Run locally

Use Node 24 and pnpm 10.15.1. The repository includes `.nvmrc` and pins pnpm in
`package.json`.

```sh
nvm use
pnpm install
pnpm storybook
```

Open http://localhost:6006.

## Check and build

```sh
pnpm typecheck
pnpm build:lib
pnpm build-storybook
```

`pnpm build` runs all three checks. The library is written to `dist/`, and the
static Storybook site is written to `storybook-static/`.

## Vercel hosting

[Live Storybook](https://ui-workshop-five.vercel.app) ·
[Vercel project](https://vercel.com/atanas-atanasovs-projects-c9bca4be/ui-workshop)

`vercel.json` builds with `pnpm build` and serves `storybook-static/` using the
Other framework preset. The project uses Node 24 and
`ENABLE_EXPERIMENTAL_COREPACK=1` so Vercel respects the pinned pnpm version.

The Vercel project connects to this GitHub repository. Pushes to `main` deploy
the production Storybook; other branches receive preview deployments.
The hosted Storybook is the review environment for future library changes.

## Package locally

```sh
pnpm pack
```

The `prepack` script builds the library before creating `poc-ui-0.1.0.tgz`.
The archive contains the library's JavaScript, TypeScript declarations and CSS.
React is supplied by the consumer through a peer dependency.

After review and approval, the consumer will put the archive in its own `vendor/`
directory and install it from that path. Component imports will use `@poc/ui`;
the stylesheet is exported as `@poc/ui/styles.css`.

## Where things live

- `src/components/`: component implementations and stories.
- `src/index.ts`: the public library exports.
- `src/library.ts`: the bundle entry, which includes the stylesheet.
- `src/styles.css`: the library stylesheet.
- `.storybook/`: Storybook configuration.
- `vite.config.ts`: the distributable library build.

## Official documentation

- [React with Vite in Storybook](https://storybook.js.org/docs/get-started/frameworks/react-vite)
- [Vite library mode](https://vite.dev/guide/build#library-mode)
- [pnpm pack](https://pnpm.io/10.x/cli/pack)
- [Figma remote MCP setup](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)
- [Storybook on Vercel](https://vercel.com/kb/guide/storybook-with-vercel)
- [Vercel package managers and Corepack](https://vercel.com/docs/package-managers)
- [Vercel deployment environments](https://vercel.com/docs/deployments/environments)
