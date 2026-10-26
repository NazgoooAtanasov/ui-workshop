import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    'storybook-addon-pseudo-states',
  ],
  staticDirs: ['../public'],
  framework: '@storybook/react-vite',
  core: {
    disableTelemetry: true,
  },
};

export default config;
