import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { z } from 'zod';

import { commitSchema, nextVersion, packageSchema, repository } from '../approval/contracts.ts';

const directory = fileURLToPath(new URL('..', import.meta.url));
const usage = 'Usage: node scripts/notify-consumers.mjs --release-pr <merged release PR number> [--dry-run]';
const consumersSchema = z.array(z.object({
  repository: z.string().regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/),
  workflow: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.ya?ml$/),
  ref: z.string().min(1),
}).strict()).min(1).superRefine((consumers, context) => {
  const targets = new Set();
  for (const consumer of consumers) {
    const target = `${consumer.repository.toLowerCase()}/${consumer.workflow}@${consumer.ref}`;
    if (targets.has(target)) context.addIssue({ code: 'custom', message: `Duplicate consumer: ${target}` });
    targets.add(target);
  }
});
const releasePrSchema = z.object({
  state: z.enum(['OPEN', 'CLOSED', 'MERGED']),
  mergeCommit: z.object({ oid: commitSchema }).nullable(),
  body: z.string(),
  baseRefName: z.string(),
  headRefName: z.string(),
  isCrossRepository: z.boolean(),
});
const contentsSchema = z.object({ encoding: z.literal('base64'), content: z.string() });
const comparisonSchema = z.object({ status: z.enum(['ahead', 'behind', 'diverged', 'identical']) });
const dispatchSchema = z.object({ workflow_run_id: z.number().int().positive(), html_url: z.url() });

function runGh(args, schema, options = {}) {
  if (options.body) args.push('--method', 'POST', '--input', '-');
  const result = spawnSync('gh', args, {
    cwd: directory,
    encoding: 'utf8',
    input: options.body ? JSON.stringify(options.body) : undefined,
    env: options.token ? { ...process.env, GH_TOKEN: options.token } : process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`GitHub command failed (${args[0]} ${args[1]}, exit ${result.status}). Check repository access and workflow configuration.`);
  }
  return schema.parse(JSON.parse(result.stdout));
}

function github(path, schema, options = {}) {
  return runGh(['api', path, '--header', 'X-GitHub-Api-Version: 2026-03-10'], schema, options);
}

function workshopPackage(sha) {
  const contents = github(`repos/${repository}/contents/package.json?ref=${sha}`, contentsSchema);
  return packageSchema.parse(JSON.parse(Buffer.from(contents.content, 'base64').toString('utf8')));
}

function main() {
  const { values } = parseArgs({ options: {
    'release-pr': { type: 'string' },
    'dry-run': { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) {
    console.log(usage);
    return;
  }
  if (!/^[1-9]\d*$/.test(values['release-pr'] ?? '')) throw new Error(usage);
  const number = z.coerce.number().int().positive().parse(values['release-pr']);
  const dryRun = values['dry-run'] ?? false;
  const consumers = consumersSchema.parse(JSON.parse(readFileSync(new URL('../consumers.json', import.meta.url), 'utf8')));
  const pull = runGh(['pr', 'view', String(number), '--repo', repository, '--json',
    'state,mergeCommit,body,baseRefName,headRefName,isCrossRepository'], releasePrSchema);
  const approvedSha = pull.body.match(/<!-- ui-workshop-approval:([a-f0-9]{40}) -->/)?.[1];
  if (
    pull.state !== 'MERGED' || !pull.mergeCommit || !approvedSha ||
    pull.baseRefName !== 'main' || pull.isCrossRepository ||
    !pull.headRefName.startsWith('release/') || !pull.headRefName.endsWith(`-${approvedSha.slice(0, 12)}`)
  ) {
    throw new Error('Choose a merged workshop release PR created by Storybook approval and targeting main.');
  }
  const sha = pull.mergeCommit.oid;
  const comparison = github(`repos/${repository}/compare/${sha}...main`, comparisonSchema);
  if (comparison.status !== 'ahead' && comparison.status !== 'identical') {
    throw new Error('The release merge commit is no longer on workshop main.');
  }
  const release = workshopPackage(sha);
  const approved = workshopPackage(approvedSha);
  if (!['patch', 'minor', 'major'].some((bump) => nextVersion(approved.version, bump) === release.version)) {
    throw new Error('The merged release must contain a version bump from the approved implementation.');
  }
  const token = process.env.CONSUMER_WORKFLOW_TOKEN;
  if (!dryRun && !token) throw new Error('Set CONSUMER_WORKFLOW_TOKEN before dispatching consumer workflows.');

  console.log(`${dryRun ? 'Dry run for' : 'Notifying consumers of'} ${release.name} ${release.version} at ${sha} (release PR #${number}).`);
  const results = [];
  for (const consumer of consumers) {
    const target = `${consumer.repository}/${consumer.workflow}@${consumer.ref}`;
    if (dryRun) {
      console.log(`Would notify ${target} with ui_commit=${sha} and ui_version=${release.version}.`);
      results.push({ target, status: 'Dry run', url: '' });
      continue;
    }
    try {
      const run = github(`repos/${consumer.repository}/actions/workflows/${consumer.workflow}/dispatches`, dispatchSchema, {
        token,
        body: { ref: consumer.ref, inputs: { ui_commit: sha, ui_version: release.version } },
      });
      console.log(`Dispatched ${target}: ${run.html_url}`);
      results.push({ target, status: 'Dispatched', url: run.html_url });
    } catch (error) {
      console.error(`${target}: ${error.message}`);
      results.push({ target, status: 'Failed', url: '' });
    }
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
      '## Consumer notifications',
      '',
      `Release PR #${number}: ${release.name} ${release.version} at [${sha.slice(0, 12)}](https://github.com/${repository}/commit/${sha}).`,
      '',
      '| Consumer workflow | Result | Run |',
      '| --- | --- | --- |',
      ...results.map((result) => `| ${result.target} | ${result.status} | ${result.url ? `[View run](${result.url})` : '—'} |`),
      '',
    ].join('\n'));
  }
  if (results.some((result) => result.status === 'Failed')) {
    throw new Error('Some consumers could not be notified. Check the results and rerun this release; consumer updates reuse existing PRs.');
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
