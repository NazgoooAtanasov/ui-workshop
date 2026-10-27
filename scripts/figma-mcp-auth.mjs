import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { isDeepStrictEqual, parseArgs } from 'node:util';

const repository = 'NazgoooAtanasov/ui-workshop';
const environment = 'figma-ci';
const secretName = 'FIGMA_MCP_CREDENTIALS';
const serverUrl = 'https://mcp.figma.com/mcp';
const usage = 'Usage: node scripts/figma-mcp-auth.mjs <login|upload|restore|save> [--home <dedicated Codex directory>]';

// Codex 0.164's file-backed MCP OAuth cache is keyed by server identity.
// Keep the original key and registration data, and export only Figma's entry.
function parseCredentials(contents) {
  let cache;
  try {
    cache = JSON.parse(contents);
  } catch {
    throw new Error('Figma MCP credentials must be valid JSON. Run the login and upload commands again.');
  }
  if (!cache || typeof cache !== 'object' || Array.isArray(cache)) {
    throw new Error('Expected a Codex MCP credential cache. Run the login and upload commands again.');
  }
  const entries = Object.entries(cache).filter(([, entry]) =>
    entry?.server_name === 'figma' && entry.server_url === serverUrl);
  if (entries.length !== 1) {
    throw new Error('Expected exactly one official Figma MCP login in the credential cache.');
  }
  const [key, entry] = entries[0];
  if (['client_id', 'access_token', 'refresh_token'].some((field) =>
    typeof entry[field] !== 'string' || !entry[field].trim())) {
    throw new Error('The Figma MCP login must include client, access, and refresh credentials. Authorize again.');
  }
  if (
    (entry.expires_at != null && (!Number.isSafeInteger(entry.expires_at) || entry.expires_at <= 0)) ||
    (entry.scopes !== undefined && (!Array.isArray(entry.scopes) || entry.scopes.some((scope) => typeof scope !== 'string')))
  ) {
    throw new Error('Unsupported Figma MCP credential cache. Run the login and upload commands again.');
  }
  return { [key]: entry };
}

function maskCredentials(credentials) {
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  for (const entry of Object.values(credentials)) {
    for (const field of ['access_token', 'refresh_token']) {
      const escaped = entry[field].replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
      console.log(`::add-mask::${escaped}`);
    }
  }
}

function prepareHome(home) {
  mkdirSync(home, { recursive: true, mode: 0o700 });
  chmodSync(home, 0o700);
  writeFileSync(join(home, 'config.toml'), [
    'mcp_oauth_credentials_store = "file"',
    '',
    '[mcp_servers.figma]',
    `url = "${serverUrl}"`,
    'required = true',
    '',
  ].join('\n'), { mode: 0o600 });
}

function readCredentials(home) {
  let contents;
  try {
    contents = readFileSync(join(home, '.credentials.json'), 'utf8');
  } catch {
    throw new Error('Cannot read the dedicated Figma MCP credential cache. Run the login command first.');
  }
  return parseCredentials(contents);
}

function uploadCredentials(credentials, token) {
  const ghEnvironment = { ...process.env };
  delete ghEnvironment.FIGMA_MCP_CREDENTIALS;
  delete ghEnvironment.FIGMA_CREDENTIALS_WRITE_TOKEN;
  delete ghEnvironment.CODEX_API_KEY;
  delete ghEnvironment.OPENAI_API_KEY;
  if (token) ghEnvironment.GH_TOKEN = token;
  const result = spawnSync('gh', ['secret', 'set', secretName, '--repo', repository, '--env', environment], {
    encoding: 'utf8',
    input: JSON.stringify(credentials),
    env: ghEnvironment,
  });
  if (result.error || result.status !== 0) {
    throw new Error('Could not save Figma MCP credentials. Check GitHub authentication and Environments write access to ui-workshop. Reauthorize and upload again if CI cannot persist a refreshed login.');
  }
  console.log(`Saved ${secretName} in ${repository}'s ${environment} environment.`);
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { home: { type: 'string' }, help: { type: 'boolean', short: 'h' } },
  });
  if (values.help) {
    console.log(usage);
    return;
  }
  if (positionals.length !== 1 || !['login', 'upload', 'restore', 'save'].includes(positionals[0])) {
    throw new Error(usage);
  }
  const command = positionals[0];
  const home = resolve(values.home ?? join(homedir(), '.codex', 'ui-workshop-figma-ci'));

  if (command === 'login') {
    prepareHome(home);
    const result = spawnSync('pnpm', ['exec', 'codex', 'mcp', 'login', 'figma'], {
      env: { ...process.env, CODEX_HOME: home },
      stdio: 'inherit',
    });
    if (result.error || result.status !== 0) throw new Error('Figma MCP authorization failed. Run login again.');
    readCredentials(home);
    console.log('Figma MCP authorization is ready. Run the upload command to seed CI.');
    return;
  }

  if (command === 'restore') {
    if (!process.env.FIGMA_CREDENTIALS_WRITE_TOKEN) {
      throw new Error('Set the FIGMA_CREDENTIALS_WRITE_TOKEN repository secret before running CI.');
    }
    if (!process.env.FIGMA_MCP_CREDENTIALS) {
      throw new Error('Seed the FIGMA_MCP_CREDENTIALS environment secret with the login and upload commands.');
    }
    const credentials = parseCredentials(process.env.FIGMA_MCP_CREDENTIALS);
    maskCredentials(credentials);
    prepareHome(home);
    const path = join(home, '.credentials.json');
    writeFileSync(path, `${JSON.stringify(credentials)}\n`, { mode: 0o600 });
    chmodSync(path, 0o600);
    console.log('Restored the Figma MCP login for Codex.');
    return;
  }

  const credentials = readCredentials(home);
  maskCredentials(credentials);
  if (command === 'save') {
    if (!process.env.FIGMA_CREDENTIALS_WRITE_TOKEN || !process.env.FIGMA_MCP_CREDENTIALS) {
      throw new Error('Saving CI credentials requires FIGMA_CREDENTIALS_WRITE_TOKEN and the original FIGMA_MCP_CREDENTIALS.');
    }
    if (isDeepStrictEqual(credentials, parseCredentials(process.env.FIGMA_MCP_CREDENTIALS))) {
      console.log('Figma MCP credentials are unchanged; no secret update is needed.');
      return;
    }
  }
  uploadCredentials(credentials, command === 'save' ? process.env.FIGMA_CREDENTIALS_WRITE_TOKEN : undefined);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
