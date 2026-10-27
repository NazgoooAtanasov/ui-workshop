import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('..', import.meta.url));
const repository = 'NazgoooAtanasov/ui-workshop';
const approvedSha = 'a'.repeat(40);
const mergeSha = 'b'.repeat(40);
const runUrl = 'https://github.com/fixture/consumer/actions/runs/123';
const consumer = { repository: 'fixture/consumer', workflow: 'ui-package-update.yml', ref: 'main' };
const roots = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture(options = {}) {
  const root = mkdtempSync(join(tmpdir(), 'ui-workshop-notification-test-'));
  roots.push(root);
  const project = join(root, 'workshop');
  const bin = join(root, 'bin');
  for (const directory of [bin, join(project, 'scripts'), join(project, 'approval')]) mkdirSync(directory, { recursive: true });
  copyFileSync(join(source, 'scripts/notify-consumers.mjs'), join(project, 'scripts/notify-consumers.mjs'));
  copyFileSync(join(source, 'approval/contracts.ts'), join(project, 'approval/contracts.ts'));
  writeFileSync(join(project, 'package.json'), '{"type":"module"}\n');
  symlinkSync(join(source, 'node_modules'), join(project, 'node_modules'), 'dir');
  writeFileSync(join(project, 'consumers.json'), JSON.stringify(options.consumers ?? [consumer]));
  writeFileSync(join(root, 'replies.json'), JSON.stringify({
    pull: {
      state: 'MERGED',
      mergeCommit: { oid: mergeSha },
      body: `<!-- ui-workshop-approval:${approvedSha} -->`,
      baseRefName: 'main',
      headRefName: `release/input-change-${approvedSha.slice(0, 12)}`,
      isCrossRepository: false,
      ...options.pull,
    },
    comparison: options.comparison ?? 'ahead',
    release: { name: '@poc/ui', private: true, version: '0.2.1', ...options.release },
    failed: options.failed ?? [],
    malformedDispatch: options.malformedDispatch ?? false,
  }));
  writeFileSync(join(bin, 'package.json'), '{"type":"module"}\n');
  writeFileSync(join(bin, 'gh'), `#!/usr/bin/env node
import {appendFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const root=process.env.NOTIFICATION_TEST_ROOT;
const replies=JSON.parse(readFileSync(join(root,'replies.json'),'utf8'));
const args=process.argv.slice(2);
const path=args[0]==='api'?args[1]:'pull/'+args[2];
const post=args.includes('POST');
if(process.env.GH_TOKEN!==(post?'fixture-dispatch-token':'fixture-read-token')) process.exit(91);
const body=post?JSON.parse(readFileSync(0,'utf8')):null;
appendFileSync(join(root,'calls.jsonl'),JSON.stringify({path,post,body})+'\\n');
let result;
if(args[0]==='pr' && args[1]==='view' && args[2]==='3') result=replies.pull;
else if(path==='repos/${repository}/compare/${mergeSha}...main') result={status:replies.comparison};
else if(path==='repos/${repository}/contents/package.json?ref=${mergeSha}') result={encoding:'base64',content:Buffer.from(JSON.stringify(replies.release)).toString('base64')};
else if(path==='repos/${repository}/contents/package.json?ref=${approvedSha}') result={encoding:'base64',content:Buffer.from(JSON.stringify({name:'@poc/ui',private:true,version:'0.2.0'})).toString('base64')};
else if(post && path.endsWith('/dispatches')) {
 if(replies.failed.some(repository=>path.startsWith('repos/'+repository+'/'))) {
  console.error('Remote error: '+process.env.GH_TOKEN);
  process.exit(1);
 }
 result=replies.malformedDispatch?{unexpected:true}:{workflow_run_id:123,html_url:'${runUrl}'};
} else process.exit(92);
process.stdout.write(JSON.stringify(result));
`);
  chmodSync(join(bin, 'gh'), 0o755);
  function execute(overrides = {}) {
    return spawnSync(process.execPath, [join(project, 'scripts/notify-consumers.mjs'),
      '--release-pr', overrides.pr ?? '3', ...(overrides.dryRun ? ['--dry-run'] : []),
    ], { cwd: root, encoding: 'utf8', timeout: 20_000,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GH_TOKEN: 'fixture-read-token',
        CONSUMER_WORKFLOW_TOKEN: overrides.noToken ? '' : 'fixture-dispatch-token',
        GITHUB_STEP_SUMMARY: join(root, 'summary.md'), NOTIFICATION_TEST_ROOT: root },
    });
  }
  function calls() {
    return existsSync(join(root, 'calls.jsonl'))
      ? readFileSync(join(root, 'calls.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line))
      : [];
  }
  return { root, execute, calls };
}

test('dispatches the merged SHA and its version using the consumer credential', () => {
  const f = fixture();
  const result = f.execute();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(f.calls().filter(call => call.post), [{
    path: 'repos/fixture/consumer/actions/workflows/ui-package-update.yml/dispatches',
    post: true,
    body: { ref: 'main', inputs: { ui_commit: mergeSha, ui_version: '0.2.1' } },
  }]);
  assert.ok(!f.calls().some(call => call.path.includes('ref=main')));
  const summary = readFileSync(join(f.root, 'summary.md'), 'utf8');
  assert.ok(summary.includes(runUrl) && summary.includes('0.2.1'));
  assert.ok(!summary.includes('fixture-dispatch-token'));
});

test('dry run validates and lists consumers without dispatching or requiring a dispatch token', () => {
  const f = fixture();
  const result = f.execute({ dryRun: true, noToken: true });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes(`ui_commit=${mergeSha}`));
  assert.ok(result.stdout.includes('ui_version=0.2.1'));
  assert.ok(!f.calls().some(call => call.post));
  assert.ok(readFileSync(join(f.root, 'summary.md'), 'utf8').includes('Dry run'));
});

test('all configured consumers are attempted and failures are reported without exposing credentials', () => {
  const f = fixture({ consumers: [
    { ...consumer, repository: 'fixture/failing' },
    { ...consumer, repository: 'fixture/working', ref: 'production' },
  ], failed: ['fixture/failing'] });
  const result = f.execute();
  assert.equal(result.status, 1);
  const calls = f.calls().filter(call => call.post);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].body.ref, 'production');
  assert.ok(result.stdout.includes(runUrl));
  assert.match(result.stderr, /Some consumers could not be notified/);
  assert.ok(!result.stderr.includes('fixture-dispatch-token'));
  const summary = readFileSync(join(f.root, 'summary.md'), 'utf8');
  assert.ok(summary.includes('Failed') && summary.includes('Dispatched'));
});

for (const [name, options] of [
  ['unmerged PR', { pull: { state: 'OPEN', mergeCommit: null } }],
  ['missing Storybook approval marker', { pull: { body: '' } }],
  ['wrong base branch', { pull: { baseRefName: 'develop' } }],
  ['fork release', { pull: { isCrossRepository: true } }],
  ['mismatched approval SHA', { pull: { headRefName: 'release/input-change-deadbeef0000' } }],
  ['release no longer on main', { comparison: 'diverged' }],
  ['unchanged package version', { release: { version: '0.2.0' } }],
  ['version inconsistent with the release bump', { release: { version: '0.2.5' } }],
  ['wrong package', { release: { name: 'another-package' } }],
]) {
  test(`${name} never dispatches consumers`, () => {
    const f = fixture(options);
    const result = f.execute();
    assert.equal(result.status, 1);
    assert.ok(!f.calls().some(call => call.post));
  });
}

for (const [name, consumers] of [
  ['empty registry', []],
  ['invalid repository', [{ ...consumer, repository: '../../unrelated' }]],
  ['workflow path instead of filename', [{ ...consumer, workflow: '../workflow.yml' }]],
  ['duplicate target', [consumer, { ...consumer }]],
]) {
  test(`${name} fails before contacting GitHub`, () => {
    const f = fixture({ consumers });
    assert.equal(f.execute().status, 1);
    assert.deepEqual(f.calls(), []);
  });
}

test('missing dispatch credentials fail before any workflow is started', () => {
  const f = fixture();
  const result = f.execute({ noToken: true });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Set CONSUMER_WORKFLOW_TOKEN/);
  assert.ok(!f.calls().some(call => call.post));
});

test('invalid PR input fails before contacting GitHub', () => {
  const f = fixture();
  assert.equal(f.execute({ pr: '3;echo unsafe' }).status, 1);
  assert.deepEqual(f.calls(), []);
});

test('an unexpected dispatch response fails instead of reporting successful notification', () => {
  const f = fixture({ malformedDispatch: true });
  const result = f.execute();
  assert.equal(result.status, 1);
  assert.ok(readFileSync(join(f.root, 'summary.md'), 'utf8').includes('Failed'));
});
