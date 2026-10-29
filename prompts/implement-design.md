Implement the component at this Figma selection in the current UI workshop repository:

{{FIGMA_URL}}

Read the repository instructions, README, existing components, CSS, and stories before editing.

Figma2RepoPoc (file key `URreSeq8ZUhiQVdQbFqhFr`) is the only source of truth for
component designs and tokens. Use component selections and any Code Connect
mappings from this file. Resolve migrated component node IDs through Figma MCP.
Do not fetch designs from retired files or assume their node IDs identify
components in this file. If the selection is outside this file or the intended
component cannot be identified, report `blocked`.

Work directly in the current checkout. Do all implementation work yourself.
The Node launcher owns Git operations outside your sandbox. Do not clone the
repository, create a temporary checkout or worktree, switch branches, commit,
push, or attempt GitHub authentication. A read-only `.git` directory is expected;
it does not prevent you from editing the working files.

Before implementing or updating the component, synchronize the shared tokens into
this checkout through Figma MCP. Always use the Theme collection's Base mode in
Figma2RepoPoc.
Follow the server's instructions and load its `figma-use` skill before using
`use_figma`. Use read-only Plugin API calls to enumerate the complete collection
and its Base-mode values, including tokens not used by the selected component.
Preserve token names, types, descriptions, and aliases; fetch referenced variables
as needed so aliases remain valid. Do not modify the Figma file.

Save the complete export in the format supported by `scripts/tokens.ts` to a
temporary JSON file outside the checkout, then run `pnpm tokens:import <file>`.
This validates the export, updates `tokens/theme.tokens.json`, and regenerates
the local Tailwind theme and merge configuration. Remove the temporary export
after importing. Do not edit generated files by hand or replace the collection
with a selection-only `get_variable_defs` response. If the collection or mode
cannot be read completely, the required MCP capability is unavailable, or import
fails, stop and report `blocked` with the exact reason; do not implement against
stale tokens or invent missing values.

Keep synchronized token changes in this checkout so the launcher includes them
in the same design branch and commit as the component changes. Inspect and report
the token diff. Shared token changes require Foundations/Theme review across all
affected components, even when their source files do not need changes.

After token synchronization succeeds, use Figma MCP to fetch fresh design context
and a screenshot for the linked component node. Follow the server's instructions
and its design-to-code skill when available. If you cannot read the design, stop
and explain the authentication or access problem without guessing.

Update the corresponding React component and Storybook stories to match the
design and its variants. Reuse this project's React, TypeScript, Tailwind theme,
assets, and conventions. Read `tokens/theme.tokens.json` and use the generated
semantic utility classes for design values. Fetch the selection's variable
definitions and map its bound variables by identity and role, not just equal values.
Use complete utility strings in variant/size maps so Tailwind can detect them;
do not construct class names with interpolation. Do not add handwritten component
CSS or `.poc-*` styling classes. Calculations may reference existing token variables.

Every public visual component must accept `className` on its root and merge it
last through the shared `cn` helper (`clsx` plus the theme-aware `tailwind-merge`).
Keep existing native-field `controlClassName` and nested component overrides.
If a token mapping is missing, report it explicitly; do not invent a hardcoded
replacement or manually change a shared token to fit the component. The token
synchronization above is authorized; other shared token edits are out of scope.

Preserve existing public props, native keyboard/pointer behavior,
disabled behavior, accessibility, and the CSS-free public declaration entry.
Keep TypeScript contracts precise and validate untyped input only at its boundary.
Keep changes focused on token synchronization and the selected component;
preserve unrelated work.

Inspect the final diff and simplify unnecessary code before finishing. Run
focused checks as needed; the launcher will run `pnpm build` before committing.

Suggest an implementation branch using `design/<component>-<change-description>`.
Use lowercase, hyphen-separated words describing what changed, for example
`design/button-change-primary-fill-to-black`. After you finish, the launcher will
create that branch from the starting default-branch commit, build, commit, and
push it to `origin` for Storybook review. Do not claim that these steps have run.

Do not create or merge a pull request or change the package version. After human
approval in Storybook, a separate release workflow will include the package
version bump in a PR targeting the repository's
default branch (`main` or `master`, as configured). The version bump belongs to that
release PR, not this implementation agent.

Do not pack or publish the library, modify CI or agent scripts, or update a consumer
repository. Package handoff follows approval and merging of the release PR.

Finish with JSON matching the supplied output schema:

- `status`: `implemented` only when the requested changes are complete,
  including when only synchronized tokens changed and the component already matches;
  `unchanged` only when both the tokens and component already match and you changed
  nothing, or `blocked` when synchronization or implementation cannot be completed.
- `branch`: the suggested implementation branch; use an empty string unless
  status is `implemented`.
- `summary`: a concise, one-line description suitable for a commit message when
  implemented; otherwise explain why no change was needed or exactly what failed.

Report checks performed and any remaining design fidelity differences in your
progress messages. Never report a blocked or partial implementation as completed.
