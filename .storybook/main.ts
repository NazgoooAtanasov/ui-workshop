import type { StorybookConfig } from '@storybook/react-vite';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { packageSchema, productionOrigin, type ReviewContext } from '../approval/contracts.ts';

const context: ReviewContext = {
  branch: process.env.VERCEL_GIT_COMMIT_REF || execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
  sha: process.env.VERCEL_GIT_COMMIT_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  version: packageSchema.parse(JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))).version,
  apiUrl: `${productionOrigin}/api/approval`,
};

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    'storybook-addon-pseudo-states',
  ],
  staticDirs: ['../public'],
  framework: '@storybook/react-vite',
  managerHead: (head) => `${head}<script>window.__WORKSHOP_REVIEW__=${JSON.stringify(context).replaceAll('<', '\\u003c')}</script>`,
  core: {
    disableTelemetry: true,
  },
};

export default config;
