# UI workshop

The shared React library and Storybook review environment for the Figma-to-React
proof of concept. This package is private and is installed from local archives.

## Pilot design

[Figma component selection](https://www.figma.com/design/UUB3GeBjzTQFswVB4p7uQf/figma-to-react-poc?node-id=9-330)

- File: `UUB3GeBjzTQFswVB4p7uQf`
- Node: `9:330`

The Button is implemented from this component's Figma MCP design context. The
Storybook state matrix covers both variants, both sizes, and all four states.

## Button contract

```tsx
import { Button } from '@poc/ui';
import '@poc/ui/styles.css';

<Button label="Continue" variant="primary" size="small" onClick={handleContinue} />;
```

- `label` is required. `variant` defaults to `primary`; `size` defaults to `small`.
- Small: 36 px high, 16 px horizontal padding, 10 px corners, Inter Bold 14/20.
- Medium: 48 px high, 24 px horizontal padding, 12 px corners, Inter Bold 16/24.
- Primary: black (`#000000`) by default and on focus, `#262626` on hover.
- Native button props, including `disabled`, `type`, `aria-*`, and React 19 `ref`,
  pass through. The default `type` is `button`, so it does not submit a form.
- Hover transitions take 120 ms and respect reduced motion. Keyboard focus has
  a 3 px lavender outline separated by a 2 px white gap, including while hovered.
- Enter, Space, and click activate the supplied action once. Disabled buttons
  cannot activate, receive hover feedback, or enter the Tab order.

Hover and focus are browser states. The Storybook-only pseudo-state addon shows
the 16 Figma combinations together without adding a forced-state component prop.
The Keyboard and Pointer and Disabled stories contain executable interaction
checks. Open the Interactions panel to inspect their assertions.

Inter Regular and Bold are self-hosted from `@fontsource/inter` and included in
the built CSS.
Its OFL notice is in `public/licenses/Inter-OFL.txt`, copied into both builds.
Library changes require Storybook approval before package handoff.

## Input contract

The [Figma Input selection](https://www.figma.com/design/UUB3GeBjzTQFswVB4p7uQf/figma-to-react-poc?node-id=19-41)
defines Default, Hover, Focus, and Disabled states.

```tsx
import { Input } from '@poc/ui';
import '@poc/ui/styles.css';

<Input
  label="Email address"
  type="email"
  name="email"
  placeholder="you@example.com"
  hint="Use your work email address."
/>;
```

- `label` is required and associated with the native input. Optional `hint` text
  is connected through `aria-describedby`, alongside any caller-supplied description.
- Starts empty; `placeholder` is not a value. Native `value`, `defaultValue`,
  `onChange`, `disabled`, `id`, and React 19 `ref` pass through to the input.
- The wrapper defaults to 320 px wide and fits narrower containers. `className`
  applies to the wrapper for resizing. Label and hint wrap with the available width.
- The control is 48 px high with 16 px horizontal padding and 12 px corners.
  Label: Inter Bold 14/20; field: Inter Regular 16/24; hint: Inter Regular 12/20.
- Hover uses a black border and `#FAFAFA` fill. Focus takes precedence, with a
  `#F5F3FF` fill and 3 px lavender ring separated by a 2 px white gap.
- Fill and border transitions take 120 ms and respect reduced motion. Disabled
  inputs cannot be edited, focused, or reached by Tab.

The Input stories include the four-state Figma preview, filled and resizable
examples, and executable Keyboard and Pointer and Disabled interaction checks.

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

## Approve a design in Storybook

Open the latest deployed `design/…` branch preview and select **Review & approve**
in the toolbar or addon panel. Confirm the branch and commit, choose a version
bump, enter the reviewer access key, and approve the revision. The panel follows
the release workflow and shows the resulting PR link. The final approval stays
inside Storybook; GitHub does not require another confirmation click.

Stories are review examples, not separate approval or version units. For this
pilot, keep each component change on its own design branch and review all of its
stories before approving. Approval covers the entire branch revision and creates
one release PR with one version bump for the whole `@poc/ui` package. You can
iterate on the component across multiple commits before requesting that release.
The approval panel follows Storybook's active manager theme, including dark mode.

The production `/api/approval` function dispatches `approve-design.yml` on `main`.
The workflow verifies the exact approved commit, builds it, adds a version-only
commit on a release branch derived from that revision, and opens a PR to `main`.
The approved design branch stays untouched. A changed branch requires
another review. Repeated approval reuses its PR, and another release waits until
the open release PR is merged or closed. Nothing is packed, published, or merged
by the approval workflow. Release logic lives in `scripts/approve-design.mjs`.

Configure these **Production-only** Vercel environment variables before using
approval, then deploy again:

- `APPROVAL_GITHUB_TOKEN`: a fine-grained token scoped only to this repository,
  with Actions write, Contents read, and Pull requests read permissions.
- `APPROVAL_ACCESS_KEY`: a private reviewer passphrase of at least 16 characters.

You can add the values directly in Vercel's project settings without sharing
them with an agent. `.env.approval.example` is a blank template for preparing
them in a local `.env.approval.local` file, which is gitignored. Local files do
not automatically configure Vercel. The public Storybook build contains neither
secret. Preview deployments use the protected production API, so credentials
are not provided to branch builds. This pilot uses one reviewer key; sharing it
grants the same approval access.

The repository must allow GitHub Actions to create pull requests. The release
workflow requests Contents write and Pull requests write for its built-in token;
the original Figma implementation workflow is unchanged.

Run `pnpm test:approval` to verify the service and release controller without
calling GitHub or creating a real pull request.

## Package locally

```sh
pnpm pack
```

The `prepack` script builds the library before creating `poc-ui-0.1.1.tgz`.
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
- [Storybook addon UI](https://storybook.js.org/docs/addons/addon-types)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [GitHub workflow dispatch API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event)
- [Vite library mode](https://vite.dev/guide/build#library-mode)
- [pnpm pack](https://pnpm.io/10.x/cli/pack)
- [Figma remote MCP setup](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)
- [Storybook on Vercel](https://vercel.com/kb/guide/storybook-with-vercel)
- [Vercel package managers and Corepack](https://vercel.com/docs/package-managers)
- [Vercel deployment environments](https://vercel.com/docs/deployments/environments)
- [Storybook pseudo-state previews](https://storybook.js.org/addons/storybook-addon-pseudo-states)
- [Storybook interaction testing](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [Fontsource self-hosting](https://fontsource.org/docs/getting-started/install)
