import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const usage = 'Usage: node scripts/implement-design.mjs --figma-url <Figma selection URL>';
const repository = fileURLToPath(new URL('..', import.meta.url));
const codexEnvironment = { ...process.env };
delete codexEnvironment.FIGMA_MCP_CREDENTIALS;
delete codexEnvironment.FIGMA_CREDENTIALS_WRITE_TOKEN;
const commandEnvironment = { ...codexEnvironment };
for (const key of ['CODEX_API_KEY', 'OPENAI_API_KEY', 'CODEX_HOME', 'FIGMA_OAUTH_TOKEN']) {
  delete commandEnvironment[key];
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repository,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    env: commandEnvironment,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    throw new Error(`${command} ${args[0]} failed; no successful push was confirmed.`);
  }

  return result.stdout?.trim() ?? '';
}

function main() {
  const { values } = parseArgs({
    options: {
      'figma-url': { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    console.log(usage);
    return;
  }

  if (!values['figma-url']) {
    throw new Error(usage);
  }

  const figmaUrl = new URL(values['figma-url']);
  if (
    !['https://www.figma.com', 'https://figma.com'].includes(figmaUrl.origin) ||
    !/^\/(design|file)\/[^/]+(?:\/|$)/.test(figmaUrl.pathname) ||
    !figmaUrl.searchParams.get('node-id')
  ) {
    throw new Error('Provide an HTTPS Figma design URL containing node-id (Copy link to selection).');
  }

  if (process.env.CI !== 'true' && run('git', ['status', '--porcelain'])) {
    throw new Error('Commit or stash existing changes, including untracked files, before running.');
  }

  const defaultBranch = run('git', ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'])
    .replace(/^origin\//, '');
  if (run('git', ['branch', '--show-current']) !== defaultBranch) {
    throw new Error(`Run from the default branch (${defaultBranch}).`);
  }

  run('git', ['var', 'GIT_AUTHOR_IDENT']);
  run('git', ['fetch', 'origin', defaultBranch]);
  const baseCommit = run('git', ['rev-parse', 'HEAD']);
  if (baseCommit !== run('git', ['rev-parse', `origin/${defaultBranch}`])) {
    throw new Error(`Update ${defaultBranch} to origin/${defaultBranch} before running.`);
  }

  const packagePath = new URL('../package.json', import.meta.url);
  const originalVersion = JSON.parse(readFileSync(packagePath, 'utf8')).version;
  const prompt = readFileSync(new URL('../prompts/implement-design.md', import.meta.url), 'utf8')
    .replace('{{FIGMA_URL}}', figmaUrl.href);
  const reportDirectory = mkdtempSync(join(tmpdir(), 'ui-workshop-codex-result-'));
  const reportPath = join(reportDirectory, 'result.json');
  const args = [
    'exec', 'codex', 'exec',
    '--sandbox', 'workspace-write',
    '--ephemeral',
    '--output-schema', fileURLToPath(new URL('../prompts/implementation-result.schema.json', import.meta.url)),
    '--output-last-message', reportPath,
    '--config', 'sandbox_workspace_write.network_access=true',
    '--config', 'mcp_servers.figma.url="https://mcp.figma.com/mcp"',
    '--config', 'mcp_servers.figma.required=true',
  ];

  if (process.env.FIGMA_OAUTH_TOKEN) {
    args.push('--config', 'mcp_servers.figma.bearer_token_env_var="FIGMA_OAUTH_TOKEN"');
  }

  try {
    run('pnpm', [...args, '-'], {
      env: codexEnvironment,
      input: prompt,
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    const result = JSON.parse(readFileSync(reportPath, 'utf8'));
    if (result.status === 'blocked') {
      throw new Error(`Codex could not complete the implementation: ${result.summary}`);
    }

    const changes = run('git', ['status', '--porcelain']);
    if (result.status === 'unchanged') {
      if (changes) {
        throw new Error('Codex reported no changes, but the checkout contains changes. Nothing was committed.');
      }
      console.log(result.summary);
      return;
    }

    if (result.status !== 'implemented' || !changes) {
      throw new Error('Codex did not produce a completed implementation with changes.');
    }
    if (!/^design\/[a-z0-9]+(?:-[a-z0-9]+)+$/.test(result.branch)) {
      throw new Error('The branch must use design/<component>-<change-description> with lowercase, hyphen-separated words.');
    }
    if (
      run('git', ['branch', '--show-current']) !== defaultBranch ||
      run('git', ['rev-parse', 'HEAD']) !== baseCommit
    ) {
      throw new Error('The branch or commit changed during implementation. Nothing was committed or pushed.');
    }
    if (JSON.parse(readFileSync(packagePath, 'utf8')).version !== originalVersion) {
      throw new Error('The implementation changed the package version; version bumps belong to the release PR.');
    }

    run('git', ['switch', '-c', result.branch, baseCommit]);
    run('pnpm', ['build'], { stdio: 'inherit' });
    run('git', ['add', '--all']);
    run('git', ['commit', '-m', result.summary], { stdio: 'inherit' });
    run('git', ['push', '--set-upstream', 'origin', result.branch], { stdio: 'inherit' });
    console.log(`Pushed ${result.branch} at ${run('git', ['rev-parse', 'HEAD'])}. Ready for Storybook review.`);
  } finally {
    rmSync(reportDirectory, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode ??= 1;
}
