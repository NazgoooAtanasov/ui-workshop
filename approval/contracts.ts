import { z } from 'zod';

export const repository = 'NazgoooAtanasov/ui-workshop';
export const workflowFile = 'storybook-approve-design.yml';
export const productionOrigin = 'https://ui-workshop-five.vercel.app';

export const designBranchSchema = z.string().regex(/^design\/[a-z0-9]+(?:-[a-z0-9]+)+$/);
export const commitSchema = z.string().regex(/^[a-f0-9]{40}$/);
export const bumpSchema = z.enum(['patch', 'minor', 'major']);
export type VersionBump = z.infer<typeof bumpSchema>;

export const approvalRequestSchema = z.object({
  designBranch: designBranchSchema,
  approvedSha: commitSchema,
  bump: bumpSchema,
  previewUrl: z.url().refine((value) => new URL(value).protocol === 'https:'),
});
export type ApprovalRequest = z.infer<typeof approvalRequestSchema>;

export const approvalStatusQuerySchema = approvalRequestSchema.pick({
  designBranch: true,
  approvedSha: true,
}).extend({ runId: z.coerce.number().int().positive() });

export const approvalResponseSchema = z.discriminatedUnion('state', [
  z.object({
    state: z.enum(['queued', 'running']),
    runId: z.number().int().positive(),
    workflowUrl: z.url(),
  }),
  z.object({ state: z.literal('completed'), prUrl: z.url() }),
  z.object({
    state: z.literal('failed'),
    message: z.string(),
    workflowUrl: z.url().optional(),
  }),
]);
export type ApprovalResponse = z.infer<typeof approvalResponseSchema>;

export const pullRequestsSchema = z.array(z.object({
  html_url: z.url(),
  body: z.string().nullable(),
  head: z.object({ ref: z.string() }),
}));

export const packageSchema = z.object({
  name: z.literal('@poc/ui'),
  version: z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/),
  private: z.literal(true),
}).passthrough();

export type ReviewContext = {
  branch: string;
  sha: string;
  version: string;
  apiUrl: string;
};

export function isComponentDesignBranch(branch: string, componentName: string) {
  const slug = componentName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase();
  return designBranchSchema.safeParse(branch).success && branch.startsWith(`design/${slug}-`);
}

export function approvalMarker(sha: string) {
  return `<!-- ui-workshop-approval:${sha} -->`;
}

export function releaseBranch(designBranch: string, sha: string) {
  return `release/${designBranch.slice('design/'.length)}-${sha.slice(0, 12)}`;
}

export function nextVersion(version: string, bump: VersionBump) {
  const [major, minor, patch] = version.split('.').map(Number);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}
