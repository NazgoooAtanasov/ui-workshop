import type { Preview } from '@storybook/react-vite';
import { ComponentDocs } from './ComponentDocs';

import '../src/styles.css';

const preview: Preview = {
  parameters: {
    docs: { page: ComponentDocs },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
