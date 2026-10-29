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

## Select contract

The [Figma Select selection](https://www.figma.com/design/UUB3GeBjzTQFswVB4p7uQf/figma-to-react-poc?node-id=30-11)
defines Default, Hover, Focus, and Disabled states.

```tsx
import { Select } from '@poc/ui';
import '@poc/ui/styles.css';

<Select label="Country" name="country" hint="Choose your country of residence.">
  <option value="bg">Bulgaria</option>
  <option value="de">Germany</option>
</Select>;
```

- Uses a native single-select with an associated label and optional described hint.
  Supply native option or optgroup children with non-empty option values.
- Starts with an empty value and the prompt `Select a country`; customize the
  prompt with `placeholder`. Both controlled `value` and uncontrolled `defaultValue`
  are supported, alongside native props, events, disabled behavior, and React 19 ref.
- Matches Input's 320 px flexible width, 48 px control, typography, colors,
  focus ring, and reduced-motion behavior. `className` applies to the wrapper.
  The decorative chevron preserves the Figma path and uses the shared size,
  stroke, and text-color tokens.
- The option menu and keyboard selection follow the browser and platform.
  Storybook includes the four-state preview, selected, controlled, resizable,
  and interaction-check examples.

## Hero Card contract

The [Figma Hero Card selection](https://www.figma.com/design/UUB3GeBjzTQFswVB4p7uQf/figma-to-react-poc?node-id=32-110)
defines `default`, `tinted`, `compact`, and `dark` variants.

```tsx
import { HeroCard } from '@poc/ui';
import '@poc/ui/styles.css';

<HeroCard variant="tinted" buttonProps={{ onClick: handleGetStarted }} />;
```

- Editable `eyebrow`, `heading`, and `description` have the Figma defaults.
  `headingLevel` defaults to 2; native section props and ref pass through.
- Uses the existing Button with a medium size and “Get started” label. Dark
  defaults to secondary; other styles default to primary. `buttonProps` accepts
  native Button props, including label, variant, size, disabled, ref, and action.
  Explicit overrides persist when changing the card variant.
- Default, tinted, and dark are 640 px wide with 32 px padding and 16 px gaps.
  Compact is 480 px wide with 24 px padding, 12 px gaps, and a smaller heading.
  Cards fit narrower containers; text and long CTA labels wrap. Small screens
  reduce padding to 24 px.
- Default and compact align the CTA right; tinted and dark align it left.
  The section is named by its heading and the card itself is not interactive.

Stories include all four styles, a style matrix, resizing, Button overrides,
keyboard/pointer assertions, and disabled assertions.

## Accordion contract

The [Figma Accordion selection](https://www.figma.com/design/URreSeq8ZUhiQVdQbFqhFr/Figma2RepoPoc?node-id=14-489)
defines collapsed and expanded states. `Accordion` uses native `details` and
`summary`: Enter, Space, and pointer activation toggle the disclosure, while
body text remains selectable. It starts collapsed; native `open`, `onToggle`,
`name`, and ref pass through. Items open independently by default.

`summary` and `content` accept editable text with the Figma defaults. The root
accepts `className`, defaults to 600 px wide, and fits narrower containers.
It uses accordion spacing, card border/radius, and shared text/focus tokens.
Stories cover both states, resizing, and keyboard/pointer interactions.

## Switch contract

The [Figma Switch selection](https://www.figma.com/design/URreSeq8ZUhiQVdQbFqhFr/Figma2RepoPoc?node-id=20-53)
defines checked and unchecked Default, Hover, Focus, and Disabled states.

`Switch` uses a native checkbox with `role="switch"`. Supply `label="Notifications"`,
`defaultChecked` for an uncontrolled initial value, or `checked` and
`onCheckedChange` for controlled usage. Native input props, form submission,
`onChange`, disabled behavior, and ref pass through. Space, Enter, and pointer
activation toggle once. The integrated label shares the 48 px target.

`className` overrides the root label and `controlClassName` overrides the native
input. `showLabel={false}` visually hides the label while retaining its accessible
name. When omitting `label`, supply `aria-label` or `aria-labelledby`.
The eight supplied track assets retain their native geometry; focus surrounds
only the track and remains visible while hovered. Hover/focus fades use the
shared interaction duration and respect reduced motion. Checked changes use
the supplied static assets rather than the Figma prototype's sliding thumb.
Stories cover all eight states, controlled usage, hidden/omitted labels, keyboard
and pointer interaction, and disabled behavior.

## Tokens and Tailwind

The [Figma Theme collection](https://www.figma.com/design/URreSeq8ZUhiQVdQbFqhFr/Figma2RepoPoc?view=variables)
is the shared token source, using its Base mode. `tokens/theme.tokens.json` is
the portable snapshot used by the workshop's React components.
Dark cards use explicit semantic roles in this collection.

`pnpm tokens:build` generates `src/generated/theme.css` and
`src/generated/merge-theme.ts`. The CSS preserves token aliases as namespaced
`--poc-*` variables and maps them to Tailwind v4 theme namespaces. The merge
metadata teaches `tailwind-merge` the same custom scales. Both generated files
are ignored by Git and regenerated by library builds, Storybook, type checking,
and unit tests. Builds never fetch live Figma values.

| Figma token | Tailwind utility examples |
| --- | --- |
| `color/action/primary/background` | `bg-action-primary-background` |
| `layout/button/medium-padding-inline` | `px-button-medium-padding-inline` |
| `size/control/height` | `h-control-height`, `min-h-control-height` |
| `radius/control` | `rounded-control` |
| `font/size/body` and `font/line-height/body` | `text-body` |
| `space/8` | `p-space-8`, `gap-space-8` (8 px) |
| `motion/duration/interaction` | `duration-interaction` |

`space/8` means 8 px in Figma; Tailwind's built-in `p-8` means 2 rem. Use the
generated semantic utilities for component design decisions. Geometry derived
from several tokens, such as wrapped CTA padding and Select's arrow clearance,
uses calculations referencing those tokens. The existing 480 px responsive
card rule remains an implementation breakpoint.

Components and their review layouts use Tailwind utilities. `src/styles.css`
contains the Tailwind imports, generated theme, fonts, and source declarations.
The library ships compiled utilities through the existing `@poc/ui/styles.css`
export. Consumers need no Tailwind configuration to render the components.
Preflight is omitted. Utilities are emitted without a cascade layer so their
class selectors retain precedence over ordinary consumer element styles such
as `h2 { font-size: ... }`.

### Updating from Figma

1. Edit variables in Figma's Theme collection and review their bound components.
2. Export the collection's Base mode and extract `Base.tokens.json` from the ZIP.
3. Import the file into a workshop design branch:

   ```sh
   pnpm tokens:import /absolute/path/to/Base.tokens.json
   pnpm build
   pnpm test:approval
   pnpm test:styles
   ```

4. Review and commit `tokens/theme.tokens.json` with any component changes.
   Import normalizes Figma's numeric dimensions to px while keeping weights
   unitless and interaction duration in milliseconds. Unsupported shapes,
   missing or circular aliases, incompatible types, and CSS name collisions
   fail before output is written. The importer supports this collection's
   sRGB colors, dimensions, numbers, strings, and whole-token aliases.
5. Review **Foundations → Theme** across all affected components, including
   their individual state and interaction stories. A shared change can use
   `design/theme-<description>` and the Theme Docs approval to create the usual
   release PR for the complete reviewed branch revision. The standard
   component approval, release version bump, and consumer notification process
   still applies.

For manual updates, use the export/import steps above. The Figma To React workflow
instructs Codex to synchronize the complete Theme collection's Base mode from
Figma2RepoPoc (`URreSeq8ZUhiQVdQbFqhFr`) through Figma MCP before implementing a
component. It imports the snapshot into the current checkout and includes token
changes in the same generated design branch. The run must stop if it cannot read
the full collection or validate the import. Shared token changes also require
Foundations/Theme review. There is no background synchronization with Figma.

### Consumer styling

Every public component accepts `className` on its root element. Input and
Select additionally expose `controlClassName` on the native control. Hero Card
accepts nested action overrides through `buttonProps.className`.

All overrides pass through the shared `cn` helper, which combines `clsx` with
`tailwind-merge`. Consumer classes are merged after base, variant, and size
classes; matching Tailwind conflicts resolve in favor of the consumer. Scoped
states such as `enabled:hover:` need matching state overrides. Custom CSS
selectors still follow the browser's cascade.

```tsx
import { Button, Input, cn } from '@poc/ui';
import '@poc/ui/styles.css';

<Button label="Continue" size="medium" className="w-full rounded-full" />
<Input label="Email" className="w-full" controlClassName="rounded-full" />
```

The **Foundations → Theme → Consumer Overrides** story demonstrates root,
control, and nested Button overrides. The distributed CSS contains the
utilities detected in workshop component and story sources. Classes introduced
only in a consumer need CSS supplied by that application or inclusion in the
workshop's generated output; `cn` does not generate CSS at runtime.

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
pnpm test:approval
pnpm exec playwright install chromium
pnpm test:styles
```

`pnpm build` runs type checking, the library build, and the Storybook build.
The library is written to `dist/`, and the static Storybook site is written to
`storybook-static/`. `pnpm test:approval` covers approval/release automation,
token parsing, and utility merging. `pnpm test:styles` runs Chromium checks
against the built Storybook for appearance, native states, token propagation,
and consumer overrides. It builds Storybook before testing; install Chromium once.

## Implement Figma changes in GitHub Actions

Run **Actions → Figma To React → Run workflow** on `main` with a Figma selection
URL containing `node-id`. The workflow uses the OpenAI API for Codex billing,
instructs Codex to synchronize shared tokens first and then read and implement
the design through the official Figma MCP server, and pushes a
`design/<component>-<change-description>` branch for Vercel's Storybook preview.
Storybook approval and the release/version PR remain separate human-driven steps.

### One-time Figma OAuth setup

The GitHub environment **`figma-ci`** is configured for this repository and
allows only the `main` branch. It stores the refreshable Figma login as an
environment secret. GitHub reads environment secrets when a job starts; this
lets a queued job receive credentials refreshed by the previous job. The
workflow's shared concurrency group prevents simultaneous refreshes.

The Node job container installs Bubblewrap and grants its sandbox launcher
`SYS_ADMIN` with container-scoped seccomp and AppArmor allowances. Codex still
runs with `workspace-write`; its inner sandbox restricts filesystem writes and
drops Linux capabilities. The launcher explicitly enables outbound network
access so sandboxed commands can download Figma assets. **Verify Codex sandbox
and network** checks repository reads, workspace writes, and an HTTPS request to
Figma's public MCP discovery endpoint before loading Figma credentials or starting
a paid model run. These container options are specific to the implementation job.

| Secret | Location in ui-workshop | Purpose |
| --- | --- | --- |
| `CODEX_API_KEY` | Settings → Secrets and variables → Actions → Repository secrets | Existing OpenAI API key; unchanged. |
| `FIGMA_CREDENTIALS_WRITE_TOKEN` | Settings → Secrets and variables → Actions → Repository secrets | GitHub token used by the auth helper to save refreshed credentials. |
| `FIGMA_MCP_CREDENTIALS` | Settings → Environments → figma-ci → Environment secrets | Full Figma MCP OAuth credential entry, seeded by the upload command below. |

1. Create a **fine-grained GitHub personal access token**, owned by
   `NazgoooAtanasov`, with repository access limited to **ui-workshop** and
   **Repository permissions → Environments: Read and write**. Metadata read
   access is automatic. This token needs no Contents or Actions write access.
   Add it as the repository secret `FIGMA_CREDENTIALS_WRITE_TOKEN`, either in
   GitHub settings or with the CLI's hidden prompt:

   ```sh
   gh secret set FIGMA_CREDENTIALS_WRITE_TOKEN --repo NazgoooAtanasov/ui-workshop
   ```

2. From the local `ui-workshop` directory, with Node 24, pnpm, and an authenticated
   GitHub CLI, install dependencies and authorize a dedicated Figma MCP login:

   ```sh
   pnpm install --frozen-lockfile
   node scripts/figma-mcp-auth.mjs login
   ```

   Complete Figma's browser sign-in and allow access. The helper uses the installed
   Codex CLI and an isolated file-backed home at
   `~/.codex/ui-workshop-figma-ci`. It leaves your normal Codex login and MCP
   credentials separate. No OpenAI API call is needed for this authorization.

3. Seed the environment secret without copying credentials into chat, terminal
   output, or the repository:

   ```sh
   node scripts/figma-mcp-auth.mjs upload
   ```

   The helper uploads only the official Figma MCP entry, including its refresh
   token and client registration information. Other MCP logins are excluded.
   You do not need `FIGMA_OAUTH_TOKEN` for this workflow.

4. Once these workflow changes are on `main`, run **Figma To React** with the
   desired selection URL. Check that **Restore Figma MCP credentials** succeeds
   and **Save refreshed Figma MCP credentials** either saves the login or reports
   that it is unchanged. Then review the design branch's Storybook preview.

### How credential refresh works

The standalone `scripts/figma-mcp-auth.mjs` helper has `login`, `upload`, `restore`,
and `save` commands. `--home <directory>` selects a dedicated Codex home; CI uses
one under the runner's temporary directory, outside the repository. `restore`
writes private credential files and configures Codex's OAuth file store. Codex
handles OAuth refresh while connecting to Figma. `save` persists changed
credentials to the environment secret through GitHub CLI's encrypted secret API.

The workflow attempts to save even if implementation or the build fails, then
removes the temporary credential directory. An unchanged login is not uploaded
again. The persistence helper is copied outside the agent's writable checkout
before implementation, and the secret-writing token is provided only to auth
steps. Codex receives its API key and the dedicated OAuth home; Git and the
launcher's build command receive neither the API key nor credential environment
variables. Access and refresh tokens are explicitly masked in Actions logs.
Credentials are never stored as workflow artifacts or committed files.

Use this dedicated authorization only through CI after seeding it. If Figma
revokes the grant, the write token expires, or a runner is forcibly terminated
before saving a rotated login, the workflow will need attention. Fix the token
permissions if necessary, then repeat `login` and `upload` while no Figma job is
running. A failed save fails the job and does not print the credential contents.

Official references: [Figma MCP setup](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/#set-up-the-codex-cli),
[Codex MCP OAuth](https://learn.chatgpt.com/docs/extend/mcp#streamable-http-servers),
[Codex command networking](https://learn.chatgpt.com/docs/agent-approvals-security#network-isolation),
[fine-grained GitHub tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token),
[environment secret permissions](https://docs.github.com/en/rest/actions/secrets#create-or-update-an-environment-secret),
and [when GitHub reads secrets](https://docs.github.com/en/actions/reference/security/secrets#when-github-actions-reads-secrets).

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

Open the latest deployed `design/…` branch preview and select the changed
component's **Docs** page. Review its examples and states, then scroll to the
**Approve Input** or **Approve Button** section at the end of the page. Confirm
the branch and commit, choose a version bump, enter the reviewer access key,
and approve the component revision. The approval section follows
the release workflow and shows the resulting PR link. The final approval stays
inside Storybook; GitHub does not require another confirmation click.

Stories are review examples, not separate approval or version units. For this
pilot, keep each component change on its own design branch and review all of its
stories before approving. Approval covers the entire branch revision and creates
one release PR with one version bump for the whole `@poc/ui` package. You can
iterate on the component across multiple commits before requesting that release.
Approval is offered only on the Docs page matching the component prefix in the
design branch name. For example, `design/input-add-field-states` is approved on
Input's Docs page, not Button's. Individual stories have no approval controls.
The approval section follows the active Docs theme, including dark mode.

The production `/api/approval` function dispatches `storybook-approve-design.yml` on `main`.
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

## Notify consumers after a release

`.github/workflows/notify-consumers.yml` runs after a Storybook release PR is
merged into `main`. Ordinary PRs and closed, unmerged releases are skipped.
The workflow calls `scripts/notify-consumers.mjs`, which reads `consumers.json`
and dispatches each registered consumer workflow. The current target is
`NazgoooAtanasov/react-router-poc` and its renamed `ui-package-update.yml` workflow.

The notifier validates the PR's approval marker, release branch, target branch,
and merge commit. It checks that the merge is still on workshop `main` and that
the approved implementation received a patch, minor, or major version bump.
Consumer inputs are derived from that exact merged revision:

- `ui_commit`: the full workshop merge commit SHA.
- `ui_version`: the package version at that commit.

The library version is bumped only by the Storybook release workflow. Consumers
adopt the release through their Git dependency reference and lockfile.
Consumer review and merging remain separate human actions.

### One-time credential setup

Create a fine-grained GitHub personal access token with resource owner
`NazgoooAtanasov`, repository access limited to the selected consumer repositories
(currently `react-router-poc`), and **Actions: Read and write**. Metadata read
access is included by GitHub. This credential starts consumer workflows;
each consumer uses its own built-in token to push branches and create PRs.

In **ui-workshop → Settings → Secrets and variables → Actions → Secrets**, add
the token as the repository secret **`CONSUMER_WORKFLOW_TOKEN`**. No repository
variable or enable switch is required. Add the secret before merging the next
workshop release after deploying this workflow.

The notification job's built-in `GH_TOKEN` reads workshop PRs and package
metadata using Contents read and Pull requests read permissions. The dispatch
token is passed only to the final notification step, not to dependency installs
or tests. The existing Vercel approval secrets serve the Storybook approval API;
the new dispatch token belongs in GitHub Actions secrets.

See [fine-grained token setup](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token),
[dispatch permissions](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event),
and [repository secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets#creating-secrets-for-a-repository).

### Test and retry notifications

Run a read-only dry run against an already merged release PR:

```sh
node scripts/notify-consumers.mjs --release-pr 3 --dry-run
```

This requires Node 24, installed workshop dependencies, GitHub CLI, and read
access to the workshop. It validates the release and lists targets without
dispatching or requiring `CONSUMER_WORKFLOW_TOKEN`.

Once the workflow is on `main`, **Actions → Notify UI consumers → Run workflow**
accepts a merged release PR number. `dry_run` defaults to true for manual runs;
uncheck it to dispatch or retry a release. Automatic merge-triggered runs dispatch
normally. The workflow uses the selected tooling revision while loading the
release package metadata from its historical merge commit, so old releases can
be retried without checking out old tooling.

All consumers are attempted even if one dispatch fails. Logs and the GitHub job
summary show the results and dispatched workflow links; any failure fails the
notification job. A successful dispatch means the consumer workflow started;
its run reports whether a PR was created. Rerunning may notify successful targets
again, and the existing consumer updater reuses an open matching PR or skips an
already installed revision. It rejects stale updates and another pending UI PR.

To onboard another consumer, install its compatible `workflow_dispatch` workflow
on its default branch, register its repository, workflow filename, and workflow
ref in `consumers.json`, and include that repository in the token's access.

## Package locally (optional)

```sh
pnpm pack
```

The `prepack` script builds the library before creating a versioned `.tgz` archive.
The archive contains the library's JavaScript, TypeScript declarations and CSS.
React is supplied by the consumer through a peer dependency.

The current React Router consumer installs directly from a pinned GitHub commit;
an archive is not needed for its update workflow. Component imports use `@poc/ui`;
the stylesheet is exported as `@poc/ui/styles.css`.

## Where things live

- `src/components/`: component implementations and stories.
- `src/index.ts`: the public library exports.
- `src/library.ts`: the bundle entry, which includes the stylesheet.
- `src/styles.css`: Tailwind, generated theme, and font imports.
- `tokens/theme.tokens.json`: the reviewed Figma token snapshot.
- `scripts/tokens.ts`: native Figma import and Tailwind theme generation.
- `src/cn.ts`: the shared class merger and generated scale configuration.
- `src/foundations/Theme.stories.tsx`: shared theme review and override examples.
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
