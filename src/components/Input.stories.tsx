import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

import { Input } from '../index';

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The [Figma Input](https://www.figma.com/design/UUB3GeBjzTQFswVB4p7uQf/figma-to-react-poc?node-id=19-41). Starts empty with placeholder text. Hover, focus, and disabled follow native input behavior; focus takes precedence over hover. The label and hint are associated with the control. Native input props and ref pass through; className styles the field wrapper.',
      },
    },
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'tel', 'url'],
    },
    className: { control: false },
    controlClassName: { control: false },
    ref: { control: false },
    onChange: { control: false },
  },
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    hint: 'Use your work email address.',
    type: 'email',
    disabled: false,
    onChange: fn(),
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hover: Story = {
  parameters: { pseudo: { hover: true } },
};

export const Focus: Story = {
  parameters: { pseudo: { focus: true } },
};

const states = ['default', 'hover', 'focus', 'disabled'] as const;

export const StateMatrix: Story = {
  parameters: {
    layout: 'padded',
    controls: { include: ['label', 'placeholder', 'hint'] },
    docs: {
      description: {
        story:
          'The four states in Figma order. Pseudo states are forced only in Storybook; the component uses real browser state.',
      },
    },
    pseudo: {
      hover: '[data-figma-state="hover"]',
      focus: '[data-figma-state="focus"]',
    },
  },
  render: (args) => (
    <div className="box-border flex flex-col gap-space-32 w-[360px] max-w-full p-space-20">
      {states.map((state) => (
        <div key={state} role="group" aria-label={`${state} state`}>
          <Input
            {...args}
            disabled={state === 'disabled'}
            data-figma-state={state}
          />
        </div>
      ))}
    </div>
  ),
};

export const Filled: Story = {
  args: { defaultValue: 'alex@example.com' },
};

export const FlexibleWidth: Story = {
  args: { className: 'w-full' },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Resize the container horizontally. The control fills the field width; longer labels and hints wrap.',
      },
    },
  },
  render: (args) => (
    <div className="box-border w-hero-compact-width min-w-[200px] max-w-full p-space-8 overflow-auto resize-x">
      <Input {...args} />
    </div>
  ),
};

export const KeyboardAndPointer: Story = {
  args: { onChange: fn(), 'aria-describedby': 'email-policy' },
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Checks the empty initial value, associated label and hint, additional description, Tab order, typing, label click, and value retention after blur.',
      },
    },
  },
  render: (args) => (
    <div className="flex flex-col items-start gap-space-24 p-space-8 [&>p]:m-0">
      <button type="button">Before input</button>
      <Input {...args} />
      <p id="email-policy">Your email stays private.</p>
      <button type="button">After input</button>
    </div>
  ),
  play: async ({ canvas, userEvent, args }) => {
    const input = canvas.getByRole('textbox', { name: args.label });
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('placeholder', args.placeholder);
    await expect(canvas.getByLabelText(args.label)).toBe(input);
    await expect(input).toHaveAccessibleDescription(
      'Your email stays private. Use your work email address.',
    );

    canvas.getByRole('button', { name: 'Before input' }).focus();
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await userEvent.type(input, 'alex@example.com');
    await expect(input).toHaveValue('alex@example.com');
    await expect(args.onChange).toHaveBeenCalled();

    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After input' })).toHaveFocus();
    await expect(input).toHaveValue('alex@example.com');

    await userEvent.click(canvas.getByText(args.label, { selector: 'label' }));
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue('alex@example.com');
  },
};

export const Disabled: Story = {
  args: { disabled: true, onChange: fn() },
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Checks that disabled inputs cannot be edited or focused and are skipped by Tab.',
      },
    },
  },
  render: (args) => (
    <div className="flex flex-col items-start gap-space-24 p-space-8 [&>p]:m-0">
      <button type="button">Before input</button>
      <Input {...args} />
      <button type="button">After input</button>
    </div>
  ),
  play: async ({ canvas, userEvent, args }) => {
    const input = canvas.getByRole('textbox', { name: args.label });
    await expect(input).toBeDisabled();
    await userEvent.type(input, 'alex@example.com');
    await expect(input).toHaveValue('');
    await expect(input).not.toHaveFocus();
    await expect(args.onChange).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByText(args.label, { selector: 'label' }));
    await expect(input).not.toHaveFocus();
    canvas.getByRole('button', { name: 'Before input' }).focus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After input' })).toHaveFocus();
  },
};
