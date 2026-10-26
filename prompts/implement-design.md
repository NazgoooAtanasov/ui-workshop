Implement the component at this Figma selection in the current UI workshop repository:

{{FIGMA_URL}}

Read the repository instructions, README, existing components, CSS, and stories before editing.
Use Figma MCP to fetch fresh design context and a screenshot for the linked node. Follow
the server's instructions and its design-to-code skill when available. If you cannot
read the design, stop and explain the authentication or access problem without guessing.

Work directly in the current checkout. Do all implementation work yourself.
The Node launcher owns Git operations outside your sandbox. Do not clone the
repository, create a temporary checkout or worktree, switch branches, commit,
push, or attempt GitHub authentication. A read-only `.git` directory is expected;
it does not prevent you from editing the working files.

Update the corresponding React component, styles, and Storybook stories to match the
design and its variants. Reuse this project's React, TypeScript, plain CSS, assets,
and conventions. Preserve existing public props, native keyboard/pointer behavior,
disabled behavior, accessibility, and the CSS-free public declaration entry.
Keep TypeScript contracts precise and validate untyped input only at its boundary.
Keep changes focused on the selected component; preserve unrelated work.

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
  `unchanged` only when the existing code already matches and you changed nothing,
  or `blocked` when implementation cannot be completed.
- `branch`: the suggested implementation branch; use an empty string unless
  status is `implemented`.
- `summary`: a concise, one-line description suitable for a commit message when
  implemented; otherwise explain why no change was needed or exactly what failed.

Report checks performed and any remaining design fidelity differences in your
progress messages. Never report a blocked or partial implementation as completed.
