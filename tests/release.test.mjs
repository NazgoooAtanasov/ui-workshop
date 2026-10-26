import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { releaseBranch } from '../approval/contracts.ts';

const source = fileURLToPath(new URL('..', import.meta.url));
const branch = 'design/input-add-field-states';
const preview = 'https://ui-workshop-example-atanas-atanasovs-projects-c9bca4be.vercel.app/';
const prUrl = 'https://github.com/NazgoooAtanasov/ui-workshop/pull/123';
const roots = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function command(cwd, executable, args) {
  const result = spawnSync(executable, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `${executable} ${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
}

function fixture(mode = 'success') {
  const root = mkdtempSync(join(tmpdir(), 'ui-workshop-release-test-'));
  roots.push(root);
  const seed = join(root, 'seed');
  const remote = join(root, 'remote.git');
  const checkout = join(root, 'checkout');
  const bin = join(root, 'bin');
  mkdirSync(seed);
  mkdirSync(bin);
  const git = (...args) => command(seed, 'git', args);
  git('init', '-b', 'main');
  git('config', 'user.name', 'Release test');
  git('config', 'user.email', 'release-test@example.invalid');
  for (const name of ['scripts', 'approval']) cpSync(join(source, name), join(seed, name), { recursive: true });
  cpSync(join(source, 'package.json'), join(seed, 'package.json'));
  writeFileSync(join(seed, '.gitignore'), 'node_modules\n');
  git('add', '--all');
  git('commit', '-m', 'Baseline');
  const mainSha = git('rev-parse', 'HEAD');
  command(root, 'git', ['clone', '--bare', seed, remote]);
  git('remote', 'add', 'origin', remote);
  git('switch', '-c', branch);
  writeFileSync(join(seed, 'Input.tsx'), 'export const Input = () => null;\n');
  git('add', '--all');
  git('commit', '-m', 'Reviewed Input implementation');
  const approvedSha = git('rev-parse', 'HEAD');
  git('push', 'origin', branch);
  command(root, 'git', ['clone', remote, checkout]);
  command(checkout, 'git', ['config', 'user.name', 'Release test']);
  command(checkout, 'git', ['config', 'user.email', 'release-test@example.invalid']);
  symlinkSync(join(source, 'node_modules'), join(checkout, 'node_modules'), 'dir');
  if (mode === 'push_rejected') {
    writeFileSync(join(remote, 'hooks/pre-receive'), '#!/bin/sh\nexit 1\n');
    chmodSync(join(remote, 'hooks/pre-receive'), 0o755);
  }

  writeFileSync(join(bin, 'gh'), `#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const args=process.argv.slice(2);
const mode=process.env.RELEASE_TEST_MODE;
if(args[0]==='api') {
  let pulls=[];
  if(mode==='duplicate') pulls=[{html_url:'${prUrl}',body:'<!-- ui-workshop-approval:'+process.env.APPROVED_TEST_SHA+' -->',head:{ref:process.env.RELEASE_TEST_BRANCH}}];
  if(mode==='other_release') pulls=[{html_url:'${prUrl}',body:'<!-- ui-workshop-approval:other -->',head:{ref:'design/button-other-change'}}];
  process.stdout.write(JSON.stringify([pulls]));
} else if(args[0]==='pr' && args[1]==='create') {
  if(mode==='pr_failed') process.exit(1);
  writeFileSync(join(process.env.RELEASE_TEST_ROOT,'pr-body.md'),readFileSync(args[args.indexOf('--body-file')+1]));
  process.stdout.write('${prUrl}');
} else process.exit(99);
`);
  writeFileSync(join(bin, 'pnpm'), `#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
if(process.env.GH_TOKEN || process.env.GITHUB_TOKEN) throw new Error('Git credentials leaked to the build');
appendFileSync(join(process.env.RELEASE_TEST_ROOT,'build-calls.txt'),process.argv.slice(2).join(' ')+'\\n');
if(process.env.RELEASE_TEST_MODE==='build_failed' && process.argv[2]==='build') process.exit(17);
`);
  chmodSync(join(bin, 'gh'), 0o755);
  chmodSync(join(bin, 'pnpm'), 0o755);
  // A package boundary makes the command shims unambiguously ES modules.
  writeFileSync(join(bin, 'package.json'), '{"type":"module"}\n');
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    GH_TOKEN: 'fixture-github-token',
    GITHUB_ACTOR: 'reviewer-fixture',
    RELEASE_TEST_MODE: mode,
    RELEASE_TEST_ROOT: root,
    APPROVED_TEST_SHA: approvedSha,
    RELEASE_TEST_BRANCH: releaseBranch(branch, approvedSha),
  };
  function execute(overrides = {}) {
    return spawnSync(process.execPath, [join(checkout, 'scripts/approve-design.mjs'),
      '--design-branch', overrides.branch ?? branch,
      '--approved-sha', overrides.sha ?? approvedSha,
      '--bump', 'minor', '--preview-url', preview,
    ], { cwd: root, env: { ...env, RELEASE_TEST_MODE: overrides.mode ?? mode, GITHUB_STEP_SUMMARY: join(root, 'summary.md') }, encoding: 'utf8', timeout: 20_000 });
  }
  const remoteGit = (...args) => command(root, 'git', ['--git-dir', remote, ...args]);
  return { root, remote, checkout, mainSha, approvedSha, execute, remoteGit };
}

test('approved release adds only a version commit and creates an auditable PR', () => {
  const f = fixture();
  const result = f.execute();
  assert.equal(result.status, 0, result.stderr);
  const head = f.remoteGit('rev-parse', `refs/heads/${releaseBranch(branch, f.approvedSha)}`);
  assert.notEqual(head, f.approvedSha);
  assert.equal(f.remoteGit('rev-parse', `refs/heads/${branch}`), f.approvedSha);
  assert.equal(f.remoteGit('rev-parse', `${head}^`), f.approvedSha);
  assert.equal(f.remoteGit('rev-parse', 'refs/heads/main'), f.mainSha);
  const manifest = JSON.parse(f.remoteGit('show', `${head}:package.json`));
  assert.equal(manifest.version, '0.2.0');
  assert.equal(manifest.private, true);
  assert.equal(f.remoteGit('diff', '--numstat', f.approvedSha, head), '1\t1\tpackage.json');
  const body = readFileSync(join(f.root, 'pr-body.md'), 'utf8');
  assert.ok(body.includes(`<!-- ui-workshop-approval:${f.approvedSha} -->`));
  assert.ok(body.includes(preview) && body.includes('@reviewer-fixture'));
  assert.ok(result.stdout.includes(prUrl));
  assert.equal(readFileSync(join(f.root, 'build-calls.txt'), 'utf8'), 'install --frozen-lockfile\nbuild\n');
});

test('a stale approved SHA never changes the remote branch or creates a PR', () => {
  const f = fixture();
  const result = f.execute({ sha: 'f'.repeat(40) });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /changed after approval/);
  assert.equal(f.remoteGit('rev-parse', `refs/heads/${branch}`), f.approvedSha);
  assert.ok(!existsSync(join(f.root, 'pr-body.md')));
});

test('default branches cannot be used as release heads', () => {
  const f = fixture();
  assert.equal(f.execute({ branch: 'main' }).status, 1);
  assert.equal(f.remoteGit('rev-parse', 'refs/heads/main'), f.mainSha);
});

test('duplicate approval reuses the matching PR without another bump or build', () => {
  const f = fixture('duplicate');
  const result = f.execute();
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes(prUrl));
  assert.equal(f.remoteGit('rev-parse', `refs/heads/${branch}`), f.approvedSha);
  assert.ok(!existsSync(join(f.root, 'build-calls.txt')));
});

test('another pending release blocks assigning the same next version', () => {
  const f = fixture('other_release');
  const result = f.execute();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /open release PR/);
  assert.equal(f.remoteGit('rev-parse', `refs/heads/${branch}`), f.approvedSha);
});

test('build failures do not bump, push, or create a PR', () => {
  const f = fixture('build_failed');
  assert.equal(f.execute().status, 17);
  assert.equal(f.remoteGit('rev-parse', `refs/heads/${branch}`), f.approvedSha);
  assert.ok(!existsSync(join(f.root, 'pr-body.md')));
});

test('rejected pushes fail without creating a PR', () => {
  const f = fixture('push_rejected');
  const result = f.execute();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /pre-receive hook declined/);
  assert.equal(f.remoteGit('rev-parse', `refs/heads/${branch}`), f.approvedSha);
  assert.ok(!existsSync(join(f.root, 'pr-body.md')));
});

test('PR creation can be retried after a release branch was successfully pushed', () => {
  const f = fixture('pr_failed');
  assert.equal(f.execute().status, 1);
  const ref = `refs/heads/${releaseBranch(branch, f.approvedSha)}`;
  const preparedSha = f.remoteGit('rev-parse', ref);
  assert.equal(f.remoteGit('rev-parse', `refs/heads/${branch}`), f.approvedSha);
  const retry = f.execute({ mode: 'success' });
  assert.equal(retry.status, 0, retry.stderr);
  assert.equal(f.remoteGit('rev-parse', ref), preparedSha);
  assert.ok(retry.stdout.includes(prUrl));
});

test('a modified prepared release branch is never silently reused or overwritten', () => {
  const f = fixture('pr_failed');
  assert.equal(f.execute().status, 1);
  const ref = `refs/heads/${releaseBranch(branch, f.approvedSha)}`;
  f.remoteGit('update-ref', ref, f.mainSha);
  const retry = f.execute({ mode: 'success' });
  assert.notEqual(retry.status, 0);
  assert.equal(f.remoteGit('rev-parse', ref), f.mainSha);
  assert.ok(!existsSync(join(f.root, 'pr-body.md')));
});
