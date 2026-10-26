import React from 'react';
import {
  Controls,
  Description,
  Primary,
  Stories,
  Subtitle,
  Title,
  Unstyled,
  useOf,
} from '@storybook/addon-docs/blocks';

import { ComponentApproval } from './ComponentApproval';

export function ComponentDocs() {
  const { preparedMeta } = useOf('meta', ['meta']);
  const componentName = preparedMeta.title.slice(preparedMeta.title.lastIndexOf('/') + 1);

  return (
    <>
      <Title />
      <Subtitle />
      <Description />
      <Primary />
      <Controls />
      <Stories />
      <Unstyled>
        <ComponentApproval key={preparedMeta.id} componentName={componentName} componentId={preparedMeta.id} />
      </Unstyled>
    </>
  );
}
