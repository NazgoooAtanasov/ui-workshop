import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn } from 'storybook/test';

import { Select, type SelectProps } from '../index';
import './Select.stories.css';

const countries = (
  <>
    <option value="bg">Bulgaria</option>
    <option value="de">Germany</option>
    <option value="gb">United Kingdom</option>
    <option value="us" disabled>United States (unavailable)</option>
  </>
);

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: { description: { component:
      'The [Figma Select](https://www.figma.com/design/UUB3GeBjzTQFswVB4p7uQf/figma-to-react-poc?node-id=30-11). Native single-select with an associated label and hint. Starts with an empty prompt; supply option children with non-empty values. Native selection, keyboard navigation, and the platform option menu are preserved. Focus takes precedence over hover. className styles the field wrapper.',
    } },
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    children: { control: false },
    className: { control: false },
    ref: { control: false },
    onChange: { control: false },
  },
  args: {
    label: 'Country',
    placeholder: 'Select a country',
    hint: 'Choose your country of residence.',
    disabled: false,
    children: countries,
    onChange: fn(),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Hover: Story = { parameters: { pseudo: { hover: true } } };
export const Focus: Story = { parameters: { pseudo: { focus: true } } };
export const Selected: Story = { args: { defaultValue: 'bg' } };

const states = ['default', 'hover', 'focus', 'disabled'] as const;
export const StateMatrix: Story = {
  parameters: {
    layout: 'padded',
    controls: { include: ['label', 'placeholder', 'hint'] },
    pseudo: {
      hover: '[data-figma-state="hover"]',
      focus: '[data-figma-state="focus"]',
    },
  },
  render: (args) => (
    <div className="select-review__states">
      {states.map((state) => (
        <div key={state} role="group" aria-label={`${state} state`}>
          <Select {...args} disabled={state === 'disabled'} data-figma-state={state} />
        </div>
      ))}
    </div>
  ),
};

export const FlexibleWidth: Story = {
  args: { className: 'select-review__fluid' },
  parameters: { layout: 'padded' },
  render: (args) => <div className="select-review__resizable"><Select {...args} /></div>,
};

const ControlledSelect = (args: SelectProps) => {
  const [value, setValue] = useState('');
  return <Select {...args} value={value} onChange={(event) => {
    setValue(event.currentTarget.value);
    args.onChange?.(event);
  }} />;
};
export const Controlled: Story = { render: (args) => <ControlledSelect {...args} /> };

const renderWithNeighbors = (args: SelectProps) => (
  <div className="select-review__interaction">
    <button type="button">Before select</button>
    <Select {...args} aria-describedby="country-policy" />
    <p id="country-policy">Used for regional preferences.</p>
    <button type="button">After select</button>
  </div>
);

export const KeyboardAndPointer: Story = {
  args: { onChange: fn() },
  render: renderWithNeighbors,
  parameters: { controls: { disable: true } },
  play: async ({ canvas, userEvent, args }) => {
    const select = canvas.getByRole('combobox', { name: args.label });
    await expect(select).toHaveValue('');
    await expect(canvas.getByLabelText(args.label)).toBe(select);
    await expect(select).toHaveAccessibleDescription(
      'Used for regional preferences. Choose your country of residence.',
    );
    canvas.getByRole('button', { name: 'Before select' }).focus();
    await userEvent.tab();
    await expect(select).toHaveFocus();
    await userEvent.selectOptions(select, 'de');
    await expect(select).toHaveValue('de');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After select' })).toHaveFocus();
    await expect(select).toHaveValue('de');
    await userEvent.click(canvas.getByText(args.label, { selector: 'label' }));
    await expect(select).toHaveFocus();
  },
};

export const Disabled: Story = {
  args: { disabled: true, onChange: fn() },
  render: renderWithNeighbors,
  parameters: { controls: { disable: true } },
  play: async ({ canvas, userEvent, args }) => {
    const select = canvas.getByRole('combobox', { name: args.label });
    await expect(select).toBeDisabled();
    await userEvent.selectOptions(select, 'de');
    await userEvent.click(select);
    await expect(select).toHaveValue('');
    await expect(select).not.toHaveFocus();
    await expect(args.onChange).not.toHaveBeenCalled();
    canvas.getByRole('button', { name: 'Before select' }).focus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After select' })).toHaveFocus();
  },
};
