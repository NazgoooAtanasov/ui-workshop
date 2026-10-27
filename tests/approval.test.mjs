import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { afterEach, beforeEach, mock, test } from 'node:test';

import approvalHandler, { handleApproval } from '../api/approval.ts';
import { approvalMarker, isComponentDesignBranch, nextVersion, productionOrigin, releaseBranch, workflowFile } from '../approval/contracts.ts';

const key = 'fixture-reviewer-key-not-a-real-secret';
const sha = 'a'.repeat(40);
const input = {
  designBranch: 'design/input-add-field-states',
  approvedSha: sha,
  bump: 'minor',
  previewUrl: 'https://ui-workshop-example-atanas-atanasovs-projects-c9bca4be.vercel.app/?path=/story/components-input--default',
};
const prUrl = 'https://github.com/NazgoooAtanasov/ui-workshop/pull/123';
const workflowUrl = 'https://github.com/NazgoooAtanasov/ui-workshop/actions/runs/456';
const pull = { html_url: prUrl, body: approvalMarker(sha), head: { ref: releaseBranch(input.designBranch, sha) } };
const original = { key: process.env.APPROVAL_ACCESS_KEY, token: process.env.APPROVAL_GITHUB_TOKEN };

beforeEach(() => {
  process.env.APPROVAL_ACCESS_KEY = key;
  process.env.APPROVAL_GITHUB_TOKEN = 'fixture-github-token';
});
afterEach(() => {
  mock.restoreAll();
  for (const [name, value] of [['APPROVAL_ACCESS_KEY', original.key], ['APPROVAL_GITHUB_TOKEN', original.token]]) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

function request(method = 'POST', body = input, options = {}) {
  const query = method === 'GET' ? `?${new URLSearchParams({ runId: '456', designBranch: input.designBranch, approvedSha: sha })}` : '';
  return new Request(`${productionOrigin}/api/approval${query}`, {
    method,
    headers: { Origin: productionOrigin, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...options.headers },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });
}

function githubReplies(...values) {
  return mock.method(globalThis, 'fetch', async () => {
    assert.ok(values.length, 'Unexpected GitHub request');
    return Response.json(values.shift());
  });
}

test('preview CORS preflight works without credentials or server configuration', async () => {
  delete process.env.APPROVAL_ACCESS_KEY;
  const response = await handleApproval(request('OPTIONS', null, { headers: { Origin: new URL(input.previewUrl).origin } }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), new URL(input.previewUrl).origin);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('foreign origins cannot submit approval', async () => {
  const response = await handleApproval(request('POST', input, { headers: { Origin: 'https://unrelated.example' } }));
  assert.equal(response.status, 403);
});

test('missing configuration fails closed', async () => {
  delete process.env.APPROVAL_GITHUB_TOKEN;
  assert.equal((await handleApproval(request())).status, 503);
});

test('incorrect keys and malformed authorization are rejected before GitHub access', async () => {
  const fetch = githubReplies();
  for (const authorization of ['Bearer wrong-key', key, '']) {
    assert.equal((await handleApproval(request('POST', input, { headers: { Authorization: authorization } }))).status, 401);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('invalid branches and non-HTTPS previews cannot trigger workflows', async () => {
  const fetch = githubReplies();
  for (const body of [{ ...input, designBranch: 'main' }, { ...input, previewUrl: 'http://localhost:6006' }]) {
    assert.equal((await handleApproval(request('POST', body))).status, 400);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('malformed request JSON is a client error', async () => {
  const original = request();
  const response = await handleApproval(new Request(original.url, { method: 'POST', headers: original.headers, body: '{' }));
  assert.equal(response.status, 400);
});

test('stale preview commits are rejected without dispatching', async () => {
  const fetch = githubReplies([], { commit: { sha: 'b'.repeat(40) } });
  assert.equal((await handleApproval(request())).status, 409);
  assert.equal(fetch.mock.callCount(), 2);
});

test('the configured Storybook approval workflow exists', () => {
  assert.ok(existsSync(new URL(`../.github/workflows/${workflowFile}`, import.meta.url)));
});

test('approval dispatches the trusted main workflow with the exact reviewed inputs', async () => {
  const fetch = githubReplies([], { commit: { sha } }, { workflow_run_id: 456, html_url: workflowUrl });
  const response = await handleApproval(request());
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { state: 'queued', runId: 456, workflowUrl });
  const [url, options] = fetch.mock.calls[2].arguments;
  assert.ok(url.endsWith('/actions/workflows/storybook-approve-design.yml/dispatches'));
  assert.equal(options.method, 'POST');
  assert.equal(options.headers.Authorization, 'Bearer fixture-github-token');
  assert.deepEqual(JSON.parse(options.body), {
    ref: 'main', inputs: { design_branch: input.designBranch, approved_sha: sha, bump: 'minor', preview_url: input.previewUrl },
  });
});

test('reviewing different stories of the same approved revision reuses one PR', async () => {
  const fetch = githubReplies([pull], [pull]);
  for (const story of ['default', 'disabled']) {
    const response = await handleApproval(request('POST', {
      ...input, previewUrl: `${new URL(input.previewUrl).origin}/?path=/story/components-input--${story}`,
    }));
    assert.deepEqual(await response.json(), { state: 'completed', prUrl });
  }
  assert.equal(fetch.mock.callCount(), 2);
});

test('running workflow status stays in Storybook', async () => {
  githubReplies({ path: '.github/workflows/storybook-approve-design.yml', status: 'in_progress', conclusion: null, html_url: workflowUrl });
  const response = await handleApproval(request('GET'));
  assert.deepEqual(await response.json(), { state: 'running', runId: 456, workflowUrl });
});

test('successful completion requires a PR recording the approved commit', async () => {
  githubReplies({ path: '.github/workflows/storybook-approve-design.yml', status: 'completed', conclusion: 'success', html_url: workflowUrl }, [pull]);
  const response = await handleApproval(request('GET'));
  assert.deepEqual(await response.json(), { state: 'completed', prUrl });
});

test('workflow failure is reported with its workflow link', async () => {
  githubReplies({ path: '.github/workflows/storybook-approve-design.yml', status: 'completed', conclusion: 'failure', html_url: workflowUrl });
  const result = await (await handleApproval(request('GET'))).json();
  assert.equal(result.state, 'failed');
  assert.equal(result.workflowUrl, workflowUrl);
});

test('success without a matching PR is reported as failure', async () => {
  githubReplies({ path: '.github/workflows/storybook-approve-design.yml', status: 'completed', conclusion: 'success', html_url: workflowUrl }, []);
  assert.equal((await (await handleApproval(request('GET'))).json()).state, 'failed');
});

test('other workflows cannot masquerade as approval runs', async () => {
  githubReplies({ path: '.github/workflows/other.yml', status: 'completed', conclusion: 'success', html_url: workflowUrl });
  assert.equal((await handleApproval(request('GET'))).status, 400);
});

test('GitHub errors and unexpected response shapes fail without disclosing credentials', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({ message: 'fixture-github-token' }, { status: 403 }));
  const response = await handleApproval(request());
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes('fixture-github-token'));
  mock.restoreAll();
  githubReplies([], { unexpected: true });
  assert.equal((await handleApproval(request())).status, 502);
});

test('version choices follow stable semver and reset lower components', () => {
  assert.equal(nextVersion('0.1.1', 'patch'), '0.1.2');
  assert.equal(nextVersion('0.1.1', 'minor'), '0.2.0');
  assert.equal(nextVersion('0.1.1', 'major'), '1.0.0');
});

test('component Docs can approve only their matching design branch', () => {
  assert.equal(isComponentDesignBranch('design/input-add-field-states', 'Input'), true);
  assert.equal(isComponentDesignBranch('design/input-add-field-states', 'Button'), false);
  assert.equal(isComponentDesignBranch('design/button-change-primary-color', 'Button'), true);
  assert.equal(isComponentDesignBranch('design/button-change-primary-color', 'Input'), false);
  assert.equal(isComponentDesignBranch('main', 'Input'), false);
});

test('Vercel HTTP entrypoint forwards parsed JSON and writes the approval response', async () => {
  githubReplies([], { commit: { sha } }, { workflow_run_id: 456, html_url: workflowUrl });
  const headers = new Map();
  let output;
  const response = {
    statusCode: 200,
    setHeader(name, value) { headers.set(name.toLowerCase(), value); },
    end(body) { output = body; },
  };
  await approvalHandler({ method: 'POST', url: '/api/approval', headers: {
    origin: productionOrigin, authorization: `Bearer ${key}`, 'content-type': 'application/json',
  }, body: input }, response);
  assert.equal(response.statusCode, 202);
  assert.equal(headers.get('access-control-allow-origin'), productionOrigin);
  assert.deepEqual(JSON.parse(output), { state: 'queued', runId: 456, workflowUrl });
});

test('Vercel HTTP entrypoint handles an invalid JSON body without dispatching', async () => {
  const fetch = githubReplies();
  let output;
  const response = { statusCode: 200, setHeader() {}, end(body) { output = body; } };
  const request = { method: 'POST', url: '/api/approval', headers: {} };
  Object.defineProperty(request, 'body', { get() { throw new SyntaxError('Invalid JSON'); } });
  await approvalHandler(request, response);
  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(output).state, 'failed');
  assert.equal(fetch.mock.callCount(), 0);
});
