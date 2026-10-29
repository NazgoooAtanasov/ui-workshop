import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('..', import.meta.url));
const roots = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function command(cwd, executable, args) {
  const result = spawnSync(executable, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `${executable} ${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
}

test('implementation rejects another Figma file before running Git or Codex', () => {
  const result = spawnSync(process.execPath, [join(source, 'scripts/implement-design.mjs'),
    '--figma-url', 'https://www.figma.com/design/retired/fixture?node-id=1-2',
  ], { encoding: 'utf8', env: { ...process.env, PATH: '' } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Provide an HTTPS Figma2RepoPoc selection URL/);
});

for (const withApiKey of [true, false]) {
  test(`implementation credentials are scoped to Codex (API key present: ${withApiKey})`, () => {
    const root = mkdtempSync(join(tmpdir(), 'workshop-implementation-auth-'));
    roots.push(root);
    const seed = join(root, 'seed');
    const remote = join(root, 'remote.git');
    const checkout = join(root, 'checkout');
    const bin = join(root, 'bin');
    mkdirSync(join(seed, 'scripts'), { recursive: true });
    mkdirSync(bin);
    copyFileSync(join(source, 'scripts/implement-design.mjs'), join(seed, 'scripts/implement-design.mjs'));
    cpSync(join(source, 'prompts'), join(seed, 'prompts'), { recursive: true });
    writeFileSync(join(seed, 'package.json'), '{"name":"@poc/ui","version":"0.2.0","type":"module"}\n');
    command(seed, 'git', ['init', '-b', 'main']);
    command(seed, 'git', ['config', 'user.name', 'Implementation test']);
    command(seed, 'git', ['config', 'user.email', 'implementation@example.invalid']);
    command(seed, 'git', ['add', '--all']);
    command(seed, 'git', ['commit', '-m', 'Baseline']);
    const mainSha = command(seed, 'git', ['rev-parse', 'HEAD']);
    command(root, 'git', ['clone', '--bare', seed, remote]);
    command(root, 'git', ['clone', remote, checkout]);
    command(checkout, 'git', ['config', 'user.name', 'Implementation test']);
    command(checkout, 'git', ['config', 'user.email', 'implementation@example.invalid']);
    for (const hook of ['pre-commit', 'pre-push']) {
      const path = join(checkout, '.git/hooks', hook);
      writeFileSync(path, '#!/bin/sh\n[ -z "$CODEX_API_KEY$OPENAI_API_KEY$CODEX_HOME$FIGMA_OAUTH_TOKEN$FIGMA_MCP_CREDENTIALS$FIGMA_CREDENTIALS_WRITE_TOKEN" ] || exit 97\n');
      chmodSync(path, 0o755);
    }
    writeFileSync(join(bin, 'package.json'), '{"type":"module"}\n');
    writeFileSync(join(bin, 'pnpm'), `#!/usr/bin/env node
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
const args=process.argv.slice(2);
if(args[0]==='exec' && args[1]==='codex') {
 assert.equal(args[args.indexOf('--sandbox')+1],'workspace-write');
 assert.ok(args.includes('sandbox_workspace_write.network_access=true'));
 assert.equal(process.env.CODEX_API_KEY,process.env.AUTH_TEST_HAS_KEY==='true'?'fixture-codex-key':undefined);
 assert.equal(process.env.OPENAI_API_KEY,process.env.AUTH_TEST_HAS_KEY==='true'?'fixture-openai-key':undefined);
 assert.equal(process.env.CODEX_HOME,join(process.env.AUTH_TEST_ROOT,'codex'));
 assert.equal(process.env.FIGMA_OAUTH_TOKEN,'fixture-figma-token');
 assert.equal(process.env.FIGMA_MCP_CREDENTIALS,undefined);
 assert.equal(process.env.FIGMA_CREDENTIALS_WRITE_TOKEN,undefined);
 writeFileSync('Implemented.tsx','export const Button = () => null;\\n');
 writeFileSync(args[args.indexOf('--output-last-message')+1],JSON.stringify({status:'implemented',branch:'design/button-auth-test',summary:'Implement fixture Button'}));
} else if(args[0]==='build') {
 assert.equal(process.env.CODEX_API_KEY,undefined);
 assert.equal(process.env.OPENAI_API_KEY,undefined);
 assert.equal(process.env.CODEX_HOME,undefined);
 assert.equal(process.env.FIGMA_OAUTH_TOKEN,undefined);
 assert.equal(process.env.FIGMA_MCP_CREDENTIALS,undefined);
 assert.equal(process.env.FIGMA_CREDENTIALS_WRITE_TOKEN,undefined);
 writeFileSync(join(process.env.AUTH_TEST_ROOT,'build-passed'),'yes');
} else process.exit(99);
`);
    chmodSync(join(bin, 'pnpm'), 0o755);
    const result = spawnSync(process.execPath, [join(checkout, 'scripts/implement-design.mjs'),
      '--figma-url', 'https://www.figma.com/design/URreSeq8ZUhiQVdQbFqhFr/fixture?node-id=1-2',
    ], { cwd: root, encoding: 'utf8', timeout: 20_000, env: {
      ...process.env, CI: 'true', PATH: `${bin}:${process.env.PATH}`,
      CODEX_API_KEY: withApiKey ? 'fixture-codex-key' : undefined,
      OPENAI_API_KEY: withApiKey ? 'fixture-openai-key' : undefined,
      CODEX_HOME: join(root, 'codex'), FIGMA_OAUTH_TOKEN: 'fixture-figma-token',
      FIGMA_MCP_CREDENTIALS: 'fixture-credential-cache', FIGMA_CREDENTIALS_WRITE_TOKEN: 'fixture-secret-writer',
      AUTH_TEST_ROOT: root, AUTH_TEST_HAS_KEY: String(withApiKey),
    } });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(join(root, 'build-passed'), 'utf8'), 'yes');
    assert.equal(command(root, 'git', ['--git-dir', remote, 'rev-parse', 'main']), mainSha);
    assert.equal(command(root, 'git', ['--git-dir', remote, 'diff', '--name-only', 'main', 'design/button-auth-test']), 'Implemented.tsx');
    assert.equal(JSON.parse(command(checkout, 'git', ['show', 'HEAD:package.json'])).version, '0.2.0');
    assert.ok(!result.stdout.includes('fixture-codex-key') && !result.stderr.includes('fixture-codex-key'));
  });
}
