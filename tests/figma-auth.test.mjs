import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/figma-mcp-auth.mjs', import.meta.url));
const roots = [];
const entry = {
  server_name: 'figma', server_url: 'https://mcp.figma.com/mcp',
  issuer: 'https://api.figma.com', client_id: 'fixture-client',
  access_token: 'fixture-access', refresh_token: 'fixture-refresh',
  expires_at: 1_800_000_000_000, scopes: ['mcp:connect'],
};
const cache = { 'figma|fixture-key': entry };

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'workshop-figma-auth-'));
  roots.push(root);
  const home = join(root, 'codex');
  const bin = join(root, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'package.json'), '{"type":"module"}\n');
  const gh = join(bin, 'gh');
  writeFileSync(gh, `#!/usr/bin/env node
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
writeFileSync(join(process.env.AUTH_TEST_ROOT,'upload.json'), JSON.stringify({
 args:process.argv.slice(2), input:readFileSync(0,'utf8'),
 token:process.env.GH_TOKEN, writer:process.env.FIGMA_CREDENTIALS_WRITE_TOKEN,
 cache:process.env.FIGMA_MCP_CREDENTIALS, apiKey:process.env.CODEX_API_KEY,
 openaiKey:process.env.OPENAI_API_KEY,
}));
if(process.env.AUTH_TEST_GH_FAIL==='true') {
 console.error('fixture-access fixture-refresh rotated-access rotated-refresh');
 process.exit(1);
}
`);
  chmodSync(gh, 0o755);
  const pnpm = join(bin, 'pnpm');
  writeFileSync(pnpm, `#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
assert.deepEqual(process.argv.slice(2),['exec','codex','mcp','login','figma']);
assert.equal(process.env.CODEX_HOME,join(process.env.AUTH_TEST_ROOT,'codex'));
assert.match(readFileSync(join(process.env.CODEX_HOME,'config.toml'),'utf8'),/mcp_oauth_credentials_store = "file"/);
writeFileSync(join(process.env.CODEX_HOME,'.credentials.json'), process.env.AUTH_TEST_LOGIN_CACHE);
`);
  chmodSync(pnpm, 0o755);
  return {
    root, home,
    run(command, env = {}) {
      return spawnSync(process.execPath, [script, command, '--home', home], {
        cwd: root, encoding: 'utf8', timeout: 10_000,
        env: {
          ...process.env, PATH: `${bin}:${process.env.PATH}`, AUTH_TEST_ROOT: root,
          AUTH_TEST_LOGIN_CACHE: JSON.stringify(cache), AUTH_TEST_GH_FAIL: '', GITHUB_ACTIONS: '',
          FIGMA_MCP_CREDENTIALS: JSON.stringify(cache), FIGMA_CREDENTIALS_WRITE_TOKEN: 'fixture-writer',
          GH_TOKEN: 'fixture-local-github', CODEX_API_KEY: 'fixture-codex-key', OPENAI_API_KEY: 'fixture-openai-key',
          ...env,
        },
      });
    },
    writeCache(contents) {
      mkdirSync(home, { recursive: true });
      writeFileSync(join(home, '.credentials.json'), JSON.stringify(contents));
    },
    upload() { return JSON.parse(readFileSync(join(root, 'upload.json'), 'utf8')); },
  };
}

function assertNoCredentialOutput(result) {
  // These commands are consumed by GitHub's runner rather than shown in its log.
  const visible = `${result.stdout}\n${result.stderr}`.split('\n')
    .filter((line) => !line.startsWith('::add-mask::')).join('\n');
  for (const secret of ['fixture-access', 'fixture-refresh', 'rotated-access', 'rotated-refresh', 'fixture-writer']) {
    assert.ok(!visible.includes(secret), `Credential appeared in output: ${visible}`);
  }
}

test('login uses a dedicated file-backed Codex home and validates refreshable credentials', () => {
  const state = fixture();
  const result = state.run('login');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(readFileSync(join(state.home, '.credentials.json'), 'utf8')), cache);
  assert.equal(statSync(state.home).mode & 0o777, 0o700);
  assertNoCredentialOutput(result);
});

test('upload seeds the environment secret without exporting unrelated MCP logins or API keys', () => {
  const state = fixture();
  state.writeCache({ ...cache, unrelated: { server_name: 'other', access_token: 'unrelated-token' } });
  const result = state.run('upload');
  assert.equal(result.status, 0, result.stderr);
  const uploaded = state.upload();
  assert.deepEqual(uploaded.args, ['secret', 'set', 'FIGMA_MCP_CREDENTIALS', '--repo', 'NazgoooAtanasov/ui-workshop', '--env', 'figma-ci']);
  assert.deepEqual(JSON.parse(uploaded.input), cache);
  assert.equal(uploaded.token, 'fixture-local-github');
  for (const field of ['writer', 'cache', 'apiKey', 'openaiKey']) assert.equal(uploaded[field], undefined);
  assertNoCredentialOutput(result);
});

test('restore writes only Figma credentials with private permissions and masks both tokens', () => {
  const state = fixture();
  state.writeCache({ stale: {} });
  chmodSync(join(state.home, '.credentials.json'), 0o644);
  const result = state.run('restore', { GITHUB_ACTIONS: 'true', FIGMA_MCP_CREDENTIALS: JSON.stringify({ ...cache, other: {} }) });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(readFileSync(join(state.home, '.credentials.json'), 'utf8')), cache);
  assert.equal(statSync(join(state.home, '.credentials.json')).mode & 0o777, 0o600);
  assert.equal(statSync(state.home).mode & 0o777, 0o700);
  assert.match(readFileSync(join(state.home, 'config.toml'), 'utf8'), /mcp_oauth_credentials_store = "file"/);
  assert.match(result.stdout, /::add-mask::fixture-access/);
  assert.match(result.stdout, /::add-mask::fixture-refresh/);
  assert.ok(!existsSync(join(state.root, 'upload.json')));
  assertNoCredentialOutput(result);
});

for (const [description, value] of [
  ['invalid JSON', 'fixture-access is not JSON'],
  ['an array', '[]'],
  ['missing Figma login', '{}'],
  ['wrong server', JSON.stringify({ key: { ...entry, server_url: 'https://example.invalid/mcp' } })],
  ['duplicate Figma logins', JSON.stringify({ one: entry, two: entry })],
  ['missing refresh token', JSON.stringify({ key: { ...entry, refresh_token: undefined } })],
  ['missing client ID', JSON.stringify({ key: { ...entry, client_id: '' } })],
  ['invalid expiry', JSON.stringify({ key: { ...entry, expires_at: 'tomorrow' } })],
  ['invalid scopes', JSON.stringify({ key: { ...entry, scopes: 'mcp:connect' } })],
]) {
  test(`restore rejects ${description} without logging credential contents`, () => {
    const state = fixture();
    const result = state.run('restore', { FIGMA_MCP_CREDENTIALS: value });
    assert.equal(result.status, 1);
    assert.ok(!existsSync(state.home));
    assert.ok(!existsSync(join(state.root, 'upload.json')));
    assertNoCredentialOutput(result);
  });
}

test('restore rejects missing secrets before Codex can refresh anything', () => {
  const state = fixture();
  for (const variable of ['FIGMA_MCP_CREDENTIALS', 'FIGMA_CREDENTIALS_WRITE_TOKEN']) {
    const result = state.run('restore', { [variable]: '' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(variable));
    assert.ok(!existsSync(state.home));
  }
});

test('save skips unchanged credentials, including differently ordered JSON properties', () => {
  const state = fixture();
  state.writeCache({ 'figma|fixture-key': Object.fromEntries(Object.entries(entry).reverse()) });
  const result = state.run('save');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /unchanged/);
  assert.ok(!existsSync(join(state.root, 'upload.json')));
});

test('save persists a refreshed access and refresh token using only the dedicated writer', () => {
  const state = fixture();
  const rotated = { 'figma|fixture-key': { ...entry, access_token: 'rotated-access', refresh_token: 'rotated-refresh' } };
  state.writeCache(rotated);
  const result = state.run('save', { GITHUB_ACTIONS: 'true' });
  assert.equal(result.status, 0, result.stderr);
  const uploaded = state.upload();
  assert.deepEqual(JSON.parse(uploaded.input), rotated);
  assert.equal(uploaded.token, 'fixture-writer');
  assert.match(result.stdout, /::add-mask::rotated-access/);
  assert.match(result.stdout, /::add-mask::rotated-refresh/);
  assertNoCredentialOutput(result);
});

test('a failed secret update fails the command, keeps the local cache, and suppresses CLI credential output', () => {
  const state = fixture();
  state.writeCache({ 'figma|fixture-key': { ...entry, access_token: 'rotated-access', refresh_token: 'rotated-refresh' } });
  const result = state.run('save', { AUTH_TEST_GH_FAIL: 'true' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Environments write access/);
  assert.ok(existsSync(join(state.home, '.credentials.json')));
  assertNoCredentialOutput(result);
});

test('save requires the original state and writer token', () => {
  const state = fixture();
  state.writeCache(cache);
  for (const variable of ['FIGMA_MCP_CREDENTIALS', 'FIGMA_CREDENTIALS_WRITE_TOKEN']) {
    const result = state.run('save', { [variable]: '' });
    assert.equal(result.status, 1);
    assert.ok(!existsSync(join(state.root, 'upload.json')));
  }
});
