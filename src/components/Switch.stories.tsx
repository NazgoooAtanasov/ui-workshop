import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Switch } from '../index';

const meta = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: { description: { component: 'The [Figma Switch](https://www.figma.com/design/URreSeq8ZUhiQVdQbFqhFr/Figma2RepoPoc?node-id=20-53). Supports checked/defaultChecked, onCheckedChange, native input props and ref. The label shares the 48 px click target. Tab focuses; Space, Enter, and pointer toggle. Focus remains visible while hovered. Supply aria-label or aria-labelledby when omitting label. className overrides the root; controlClassName overrides the native input.' } },
  },
  args: { label: 'Notifications', onCheckedChange: fn() },
  argTypes: { className: { control: false }, controlClassName: { control: false }, ref: { control: false } },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Hover: Story = { parameters: { pseudo: { hover: true } } };
export const Focus: Story = { parameters: { pseudo: { focusVisible: true } } };
export const WithoutLabel: Story = { args: { label: undefined, 'aria-label': 'Notifications' } };
export const HiddenLabel: Story = { args: { showLabel: false } };
export const StateMatrix: Story = {
  parameters: {
    layout: 'padded',
    pseudo: { hover: '[data-state="hover"]', focusVisible: '[data-state="focus"]' },
  },
  render: (args) => (
    <div className="grid grid-cols-2 gap-x-space-64 gap-y-space-16 p-space-20 w-fit max-w-full">
      {(['default', 'hover', 'focus', 'disabled'] as const).flatMap((state) =>
        [false, true].map((checked) => (
          <Switch {...args} key={`${state}-${checked}`} checked={checked} disabled={state === 'disabled'} data-state={state} />
        )),
      )}
    </div>
  ),
};
export const Controlled: Story = {
  render: function ControlledExample(args) {
    const [checked, setChecked] = useState(false);
    return <Switch {...args} checked={checked} onCheckedChange={(value) => { setChecked(value); args.onCheckedChange?.(value); }} />;
  },
};
export const KeyboardAndPointer: Story = {
  args: { onCheckedChange: fn() },
  render: (args) => <div className="flex flex-col gap-space-24"><button>Before switch</button><Switch {...args} /><button>After switch</button></div>,
  play: async ({ canvas, userEvent, args }) => {
    const control = canvas.getByRole('switch', { name: 'Notifications' });
    await expect(control).not.toBeChecked();
    canvas.getByText('Before switch').focus();
    await userEvent.tab();
    await expect(control).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(control).toBeChecked();
    await userEvent.keyboard('{Enter}');
    await expect(control).not.toBeChecked();
    await userEvent.click(canvas.getByText('Notifications'));
    await expect(control).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalledTimes(3);
    await expect(control).toHaveAccessibleName('Notifications');
    await userEvent.tab();
    await expect(canvas.getByText('After switch')).toHaveFocus();
  },
};
export const Disabled: Story = {
  args: { disabled: true, onCheckedChange: fn() },
  render: KeyboardAndPointer.render,
  play: async ({ canvas, userEvent, args }) => {
    const control = canvas.getByRole('switch');
    await expect(control).toBeDisabled();
    await userEvent.click(canvas.getByText('Notifications'));
    await expect(control).not.toBeChecked();
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
    canvas.getByText('Before switch').focus();
    await userEvent.tab();
    await expect(canvas.getByText('After switch')).toHaveFocus();
  },
};
