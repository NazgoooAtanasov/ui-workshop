import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

import {
  approvalMarker,
  approvalRequestSchema,
  approvalStatusQuerySchema,
  productionOrigin,
  pullRequestsSchema,
  releaseBranch,
  repository,
  workflowFile,
  type ApprovalResponse,
} from '../approval/contracts.ts';

const configurationSchema = z.object({
  token: z.string().min(1),
  accessKey: z.string().min(16),
});
const branchSchema = z.object({ commit: z.object({ sha: z.string() }) });
const dispatchSchema = z.object({ workflow_run_id: z.number(), html_url: z.url() });
const runSchema = z.object({
  path: z.string(),
  status: z.enum(['queued', 'in_progress', 'completed', 'waiting', 'pending', 'requested']),
  conclusion: z.string().nullable(),
  html_url: z.url(),
});

class GitHubRequestError extends Error {}

async function github<T>(token: string, path: string, schema: z.ZodType<T>, init: RequestInit = {}) {
  const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2026-03-10',
      'User-Agent': 'ui-workshop-storybook-approval',
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new GitHubRequestError(`GitHub returned HTTP ${response.status}. Check the approval service's repository access.`);
  }
  return schema.parse(await response.json());
}

async function findPullRequest(token: string, branch: string, sha: string) {
  const query = new URLSearchParams({ state: 'open', base: 'main', head: `NazgoooAtanasov:${releaseBranch(branch, sha)}` });
  const pulls = await github(token, `pulls?${query}`, pullRequestsSchema);
  return pulls.find((pull) => pull.body?.includes(approvalMarker(sha)));
}

async function handle(request: Request): Promise<Response> {
  const origin = request.headers.get('origin');
  const headers = new Headers({ 'Cache-Control': 'no-store', Vary: 'Origin' });
  const reply = (body: ApprovalResponse, status = 200) => Response.json(body, { status, headers });

  if (origin) {
    if (
      origin !== productionOrigin &&
      !/^https:\/\/ui-workshop-[a-z0-9-]+-atanas-atanasovs-projects-c9bca4be\.vercel\.app$/.test(origin)
    ) {
      return reply({ state: 'failed', message: 'This Storybook origin is not allowed.' }, 403);
    }
    headers.set('Access-Control-Allow-Origin', origin);
  }
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'POST'].includes(request.method)) {
    return reply({ state: 'failed', message: 'Use GET or POST.' }, 405);
  }

  const configuration = configurationSchema.safeParse({
    token: process.env.APPROVAL_GITHUB_TOKEN,
    accessKey: process.env.APPROVAL_ACCESS_KEY,
  });
  if (!configuration.success) {
    return reply({ state: 'failed', message: 'The approval service has not been configured yet.' }, 503);
  }
  const authorization = request.headers.get('authorization') ?? '';
  const providedKey = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!timingSafeEqual(
    createHash('sha256').update(providedKey).digest(),
    createHash('sha256').update(configuration.data.accessKey).digest(),
  )) {
    return reply({ state: 'failed', message: 'The reviewer access key is incorrect.' }, 401);
  }

  const { token } = configuration.data;
  try {
    if (request.method === 'POST') {
      const input = approvalRequestSchema.safeParse(await request.json().catch(() => null));
      if (!input.success) {
        return reply({ state: 'failed', message: 'Choose a valid design branch, commit, version bump, and preview URL.' }, 400);
      }
      const { designBranch, approvedSha, bump, previewUrl } = input.data;
      const existing = await findPullRequest(token, designBranch, approvedSha);
      if (existing) return reply({ state: 'completed', prUrl: existing.html_url });

      const branch = await github(token, `branches/${encodeURIComponent(designBranch)}`, branchSchema);
      if (branch.commit.sha !== approvedSha) {
        return reply({
          state: 'failed',
          message: 'This branch changed after the preview was built. Review its latest deployment before approving.',
        }, 409);
      }
      const run = await github(token, `actions/workflows/${workflowFile}/dispatches`, dispatchSchema, {
        method: 'POST',
        body: JSON.stringify({
          ref: 'main',
          inputs: { design_branch: designBranch, approved_sha: approvedSha, bump, preview_url: previewUrl },
        }),
      });
      return reply({ state: 'queued', runId: run.workflow_run_id, workflowUrl: run.html_url }, 202);
    }

    const input = approvalStatusQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!input.success) return reply({ state: 'failed', message: 'Invalid approval status request.' }, 400);
    const { runId, designBranch, approvedSha } = input.data;
    const run = await github(token, `actions/runs/${runId}`, runSchema);
    if (run.path !== `.github/workflows/${workflowFile}`) {
      return reply({ state: 'failed', message: 'This run is not an approval workflow.' }, 400);
    }
    if (run.status !== 'completed') {
      return reply({ state: 'running', runId, workflowUrl: run.html_url });
    }
    if (run.conclusion !== 'success') {
      return reply({ state: 'failed', message: 'The release workflow did not succeed.', workflowUrl: run.html_url });
    }
    const pull = await findPullRequest(token, designBranch, approvedSha);
    if (!pull) {
      return reply({ state: 'failed', message: 'The workflow finished without a matching pull request.', workflowUrl: run.html_url });
    }
    return reply({ state: 'completed', prUrl: pull.html_url });
  } catch (error) {
    return reply({
      state: 'failed',
      message: error instanceof GitHubRequestError
        ? error.message
        : 'GitHub could not complete this request. Check the approval service configuration and try again.',
    }, 502);
  }
}

export default { fetch: handle };
