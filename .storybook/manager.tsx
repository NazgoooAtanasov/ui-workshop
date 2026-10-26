import React, { useEffect, useState } from 'react';
import { AddonPanel } from 'storybook/internal/components';
import { addons, types, useStorybookApi } from 'storybook/manager-api';
import { styled } from 'storybook/theming';

import {
  approvalResponseSchema,
  bumpSchema,
  designBranchSchema,
  nextVersion,
  repository,
  type ApprovalResponse,
  type ReviewContext,
  type VersionBump,
} from '../approval/contracts';
import './approval.css';

declare global {
  interface Window {
    __WORKSHOP_REVIEW__: ReviewContext;
  }
}

const panelId = 'workshop/approval/panel';

const ApprovalSurface = styled.section(({ theme }) => ({
  background: theme.background.content,
  color: theme.fgColor.default,
  fontFamily: theme.typography.fonts.base,
  '& a': { color: theme.fgColor.accent },
  '& .workshop-approval__badge, & .workshop-approval__notice, & .workshop-approval__status p': {
    background: theme.bgColor.muted,
  },
  '& .workshop-approval__revision': { borderColor: theme.appBorderColor },
  '& dt, & .workshop-approval__version, & .workshop-approval__footnote': {
    color: theme.fgColor.muted,
  },
  '& .workshop-approval__field input, & select, & option': {
    background: theme.input.background,
    color: theme.input.color,
    borderColor: theme.input.border,
  },
  '& input': { accentColor: theme.fgColor.accent },
  '& .workshop-approval__submit': {
    background: theme.fgColor.default,
    color: theme.fgColor.inverse,
  },
  '& .workshop-approval__status .workshop-approval__success': {
    background: theme.bgColor.positive,
    color: theme.fgColor.positive,
  },
  '& .workshop-approval__status .workshop-approval__error': {
    background: theme.bgColor.negative,
    color: theme.fgColor.negative,
  },
  '& .workshop-approval__success a, & .workshop-approval__error a': { color: 'inherit' },
  '& input:focus-visible, & select:focus-visible, & button:focus-visible, & a:focus-visible': {
    outline: `2px solid ${theme.fgColor.accent}`,
    outlineOffset: 3,
  },
}));

const ApprovalToolButton = styled.button(({ theme }) => ({
  color: theme.barTextColor,
  '&:hover': { background: theme.background.hoverable, color: theme.barHoverColor },
  '&:focus-visible': { outline: `2px solid ${theme.fgColor.accent}`, outlineOffset: 3 },
}));

function ApprovalPanel({ active }: { active: boolean }) {
  const context = window.__WORKSHOP_REVIEW__;
  const [bump, setBump] = useState<VersionBump>('patch');
  const [accessKey, setAccessKey] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApprovalResponse | null>(null);
  const canApprove = designBranchSchema.safeParse(context.branch).success && window.location.protocol === 'https:';
  const pending = result?.state === 'queued' || result?.state === 'running';

  useEffect(() => {
    if (!pending) return;
    const controller = new AbortController();
    const query = new URLSearchParams({
      runId: String(result.runId),
      designBranch: context.branch,
      approvedSha: context.sha,
    });
    let timer: number;
    async function poll() {
      try {
        const response = await fetch(`${context.apiUrl}?${query}`, {
          headers: { Authorization: `Bearer ${accessKey}` },
          signal: controller.signal,
        });
        const update = approvalResponseSchema.parse(await response.json());
        if (update.state === 'queued' || update.state === 'running') {
          timer = window.setTimeout(poll, 5_000);
          return;
        }
        setResult(update.state === 'failed' ? { ...update, workflowUrl: update.workflowUrl ?? result.workflowUrl } : update);
        setAccessKey('');
      } catch {
        if (!controller.signal.aborted) {
          setResult({ state: 'failed', message: 'The workflow status could not be loaded. Check its progress below before trying again.', workflowUrl: result.workflowUrl });
          setAccessKey('');
        }
      }
    }
    timer = window.setTimeout(poll, 3_000);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [pending, result, context, accessKey]);

  async function approve(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const response = await fetch(context.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessKey}` },
        body: JSON.stringify({
          designBranch: context.branch,
          approvedSha: context.sha,
          bump,
          previewUrl: window.location.href,
        }),
      });
      const update = approvalResponseSchema.parse(await response.json());
      setResult(update);
      if (update.state !== 'queued' && update.state !== 'running') setAccessKey('');
    } catch {
      setResult({ state: 'failed', message: 'The approval service could not be reached. Try again when the connection is available.' });
      setAccessKey('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AddonPanel active={active}>
      <ApprovalSurface className="workshop-approval" aria-label="Component change approval">
        <header className="workshop-approval__header">
          <div>
            <h2>Review component changes</h2>
            <p>Review all states and stories for the changed components, then approve this revision as a whole.</p>
          </div>
          <span className="workshop-approval__badge">@poc/ui</span>
        </header>
        <dl className="workshop-approval__revision">
          <div><dt>Branch</dt><dd>{context.branch}</dd></div>
          <div><dt>Commit</dt><dd><a href={`https://github.com/${repository}/commit/${context.sha}`} target="_blank" rel="noreferrer">{context.sha.slice(0, 10)}</a></dd></div>
          <div><dt>Current version</dt><dd>{context.version}</dd></div>
        </dl>
        <p className="workshop-approval__notice"><strong>One approval covers all stories.</strong> This approves every change in the branch revision and prepares one release PR for the @poc/ui package.</p>

        {!canApprove ? (
          <p className="workshop-approval__notice">Open a deployed <code>design/…</code> branch preview to approve its changes. This deployment is available for review only.</p>
        ) : (
          <form onSubmit={approve}>
            <fieldset disabled={submitting || pending || result?.state === 'completed'}>
              <label className="workshop-approval__field">
                <span>Version bump</span>
                <select value={bump} onChange={(event) => setBump(bumpSchema.parse(event.target.value))}>
                  <option value="patch">Patch — fixes and visual adjustments</option>
                  <option value="minor">Minor — new components or features</option>
                  <option value="major">Major — breaking changes</option>
                </select>
              </label>
              <p className="workshop-approval__version">Proposed release: <strong>{nextVersion(context.version, bump)}</strong></p>
              <label className="workshop-approval__field">
                <span>Reviewer access key</span>
                <input type="password" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} autoComplete="current-password" required />
              </label>
              <label className="workshop-approval__confirmation">
                <input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} />
                <span>I reviewed every changed component and its stories, and approve this revision for release.</span>
              </label>
              <button className="workshop-approval__submit" type="submit" disabled={!reviewed || !accessKey}>
                {submitting || pending ? 'Creating pull request…' : 'Approve changes & create PR'}
              </button>
            </fieldset>
          </form>
        )}

        <div aria-live="polite" className="workshop-approval__status">
          {pending && <p>Your approval was submitted. The release workflow is checking the revision and preparing the pull request. <a href={result.workflowUrl} target="_blank" rel="noreferrer">View workflow</a></p>}
          {result?.state === 'completed' && <p className="workshop-approval__success">Pull request ready. <a href={result.prUrl} target="_blank" rel="noreferrer">Open pull request</a></p>}
          {result?.state === 'failed' && <p role="alert" className="workshop-approval__error">{result.message} {result.workflowUrl && <a href={result.workflowUrl} target="_blank" rel="noreferrer">View workflow</a>}</p>}
        </div>
        <p className="workshop-approval__footnote">You can keep improving this branch before approving. The release PR proposes one package version; stories do not receive separate versions. Merging and package handoff happen afterward. Your access key is never saved in browser storage.</p>
      </ApprovalSurface>
    </AddonPanel>
  );
}

function ApprovalTool() {
  const api = useStorybookApi();
  return (
    <ApprovalToolButton className="workshop-approval-tool" type="button" onClick={() => {
      api.togglePanel(true);
      api.setSelectedPanel(panelId);
    }}>
      <span aria-hidden="true">✓</span> Review & approve
    </ApprovalToolButton>
  );
}

addons.register('workshop/approval', () => {
  addons.add(panelId, {
    type: types.PANEL,
    title: 'Review & approve',
    render: ({ active }) => <ApprovalPanel active={!!active} />,
  });
  addons.add('workshop/approval/tool', {
    type: types.TOOL,
    title: 'Review & approve',
    match: ({ viewMode }) => viewMode === 'story',
    render: () => <ApprovalTool />,
  });
});
