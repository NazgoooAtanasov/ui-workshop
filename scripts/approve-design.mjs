import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import {
  approvalMarker,
  approvalRequestSchema,
  nextVersion,
  packageSchema,
  pullRequestsSchema,
  releaseBranch,
  repository,
} from '../approval/contracts.ts';

const directory = fileURLToPath(new URL('..', import.meta.url));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: directory,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    throw new Error(`${command} ${args[0]} failed. The release PR was not completed.`);
  }
  return result.stdout?.trim() ?? '';
}

function report(url) {
  console.log(`Release pull request: ${url}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Approved design\n\n[Open the release pull request](${url})\n`);
  }
}

function main() {
  const { values } = parseArgs({ options: {
    'design-branch': { type: 'string' },
    'approved-sha': { type: 'string' },
    bump: { type: 'string' },
    'preview-url': { type: 'string' },
  } });
  const { designBranch, approvedSha, bump, previewUrl } = approvalRequestSchema.parse({
    designBranch: values['design-branch'],
    approvedSha: values['approved-sha'],
    bump: values.bump,
    previewUrl: values['preview-url'],
  });
  const releaseHead = releaseBranch(designBranch, approvedSha);
  if (process.env.CI !== 'true' && run('git', ['status', '--porcelain'])) {
    throw new Error('The release workflow requires a clean checkout.');
  }

  const query = new URLSearchParams({ state: 'open', base: 'main', per_page: '100' });
  const pulls = pullRequestsSchema.array().parse(JSON.parse(run('gh', [
    'api', '--paginate', '--slurp', `repos/${repository}/pulls?${query}`,
  ]))).flat();
  const existing = pulls.filter((pull) => pull.head.ref === releaseHead);
  if (existing.length) {
    const approved = existing.find((pull) => pull.body?.includes(approvalMarker(approvedSha)));
    if (!approved) throw new Error('This branch already has a PR for a different approval.');
    report(approved.html_url);
    return;
  }
  if (pulls.some((pull) => pull.body?.includes('<!-- ui-workshop-approval:'))) {
    throw new Error('Merge or close the open release PR before approving another release.');
  }

  run('git', ['fetch', 'origin', 'main', `refs/heads/${designBranch}:refs/remotes/origin/${designBranch}`]);
  if (run('git', ['rev-parse', `refs/remotes/origin/${designBranch}`]) !== approvedSha) {
    throw new Error('The design branch changed after approval. Review the latest Storybook deployment again.');
  }
  const basePackage = packageSchema.parse(JSON.parse(run('git', ['show', 'origin/main:package.json'])));
  run('git', ['switch', '--detach', approvedSha]);
  const packagePath = join(directory, 'package.json');
  const manifest = packageSchema.parse(JSON.parse(readFileSync(packagePath, 'utf8')));
  if (manifest.version !== basePackage.version) {
    throw new Error('The design branch version differs from main. Update the branch and review it again.');
  }

  const buildEnvironment = { ...process.env };
  delete buildEnvironment.GH_TOKEN;
  delete buildEnvironment.GITHUB_TOKEN;
  run('pnpm', ['install', '--frozen-lockfile'], { env: buildEnvironment, stdio: 'inherit' });
  run('pnpm', ['build'], { env: buildEnvironment, stdio: 'inherit' });
  if (run('git', ['status', '--porcelain'])) {
    throw new Error('The build changed tracked or untracked source files. Nothing was committed.');
  }

  manifest.version = nextVersion(manifest.version, bump);
  const prepared = run('git', ['ls-remote', '--heads', 'origin', `refs/heads/${releaseHead}`]);
  if (prepared) {
    run('git', ['fetch', 'origin', `refs/heads/${releaseHead}`]);
    const preparedSha = run('git', ['rev-parse', 'FETCH_HEAD']);
    const preparedPackage = packageSchema.parse(JSON.parse(run('git', ['show', `${preparedSha}:package.json`])));
    if (
      run('git', ['rev-parse', `${preparedSha}^`]) !== approvedSha ||
      run('git', ['diff', '--name-only', approvedSha, preparedSha]) !== 'package.json' ||
      JSON.stringify(preparedPackage) !== JSON.stringify(manifest)
    ) {
      throw new Error('The prepared release branch does not match the approved code and requested version bump.');
    }
  } else {
    writeFileSync(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
    run('git', ['add', '--', 'package.json']);
    run('git', ['commit', '-m', `chore(release): @poc/ui ${manifest.version}`], { stdio: 'inherit' });
    run('git', ['push', 'origin', `HEAD:refs/heads/${releaseHead}`], { stdio: 'inherit' });
  }

  const bodyDirectory = mkdtempSync(join(tmpdir(), 'ui-workshop-release-pr-'));
  try {
    const bodyPath = join(bodyDirectory, 'body.md');
    writeFileSync(bodyPath, [
      approvalMarker(approvedSha),
      '',
      `Prepare @poc/ui ${manifest.version} from the design revision approved in Storybook.`,
      '',
      `- Approved branch: \`${designBranch}\``,
      `- Approved implementation commit: \`${approvedSha}\``,
      `- Storybook preview: <${previewUrl}>`,
      `- Workflow initiated by: @${process.env.GITHUB_ACTOR || 'local-reviewer'}`,
      `- Version: ${basePackage.version} → ${manifest.version} (${bump})`,
      '- Validation: pnpm install --frozen-lockfile; pnpm build.',
      '',
      'The release commit changes only the package version. No package was packed or published.',
      'Merge this PR before consumers adopt the released workshop commit.',
      '',
    ].join('\n'));
    report(run('gh', ['pr', 'create', '--repo', repository, '--base', 'main', '--head', releaseHead,
      '--title', `Release @poc/ui ${manifest.version}`, '--body-file', bodyPath]));
  } finally {
    rmSync(bodyDirectory, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode ??= 1;
}
