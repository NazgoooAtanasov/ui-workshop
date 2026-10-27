import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SyntheticEvent } from 'react';
import { expect, fn } from 'storybook/test';

import { Button, type ButtonProps } from '../index';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The [Figma Button](https://www.figma.com/design/UUB3GeBjzTQFswVB4p7uQf/figma-to-react-poc?node-id=9-330). Hover and focus follow browser interactions; disabled uses the native attribute. The consuming screen supplies the action.',
      },
    },
  },
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
    size: { control: 'inline-radio', options: ['small', 'medium'] },
    disabled: { control: 'boolean' },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    className: { control: false },
    ref: { control: false },
    onClick: { control: false },
  },
  args: {
    label: 'Continue',
    variant: 'primary',
    size: 'small',
    disabled: false,
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PrimarySmall: Story = {};

export const PrimaryMedium: Story = {
  args: { size: 'medium' },
};

export const SecondarySmall: Story = {
  args: { variant: 'secondary' },
};

export const SecondaryMedium: Story = {
  args: { variant: 'secondary', size: 'medium' },
};

const variants = ['primary', 'secondary'] as const;
const sizes = ['small', 'medium'] as const;
const states = ['default', 'hover', 'focus', 'disabled'] as const;

export const StateMatrix: Story = {
  parameters: {
    layout: 'padded',
    controls: { include: ['label'] },
    docs: {
      description: {
        story:
          'All 16 Figma combinations. Pseudo states are forced only in this review story; the component API uses real browser state.',
      },
    },
    pseudo: {
      hover: '[data-figma-state="hover"]',
      focusVisible: '[data-figma-state="focus"]',
    },
  },
  render: (args) => (
    <div className="overflow-x-auto p-space-8 font-sans text-text-primary">
      <table className="border-separate border-spacing-space-24 whitespace-nowrap [&_caption]:p-space-8 [&_caption]:text-left [&_caption]:font-semibold [&_th]:text-label [&_th]:font-semibold [&_th]:text-left [&_th]:capitalize [&_td]:p-space-8 [&_td]:text-center">
        <caption>Figma button states</caption>
        <thead>
          <tr>
            <th scope="col">Variant / size</th>
            {states.map((state) => (
              <th key={state} scope="col">
                {state}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {variants.flatMap((variant) =>
            sizes.map((size) => (
              <tr key={`${variant}-${size}`}>
                <th scope="row">
                  {variant} / {size}
                </th>
                {states.map((state) => (
                  <td key={state}>
                    <Button
                      {...args}
                      variant={variant}
                      size={size}
                      disabled={state === 'disabled'}
                      data-figma-state={state}
                    />
                  </td>
                ))}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  ),
};

const onSubmit = fn((event: SyntheticEvent<HTMLFormElement>) => {
  event.preventDefault();
});

const renderInForm = (args: ButtonProps) => (
  <form className="flex items-center flex-wrap gap-space-24 p-space-16 [&_input]:w-[120px] [&_input]:p-space-8" onSubmit={onSubmit}>
    <input aria-label="Before button" placeholder="Before button" />
    <Button {...args} />
    <input aria-label="After button" placeholder="After button" />
  </form>
);

export const KeyboardAndPointer: Story = {
  args: { onClick: fn() },
  render: renderInForm,
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Checks Tab order, one activation per Enter, Space, or click, and that the default button type does not submit its form.',
      },
    },
  },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole('button', { name: args.label });
    canvas.getByRole('textbox', { name: 'Before button' }).focus();

    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    await userEvent.keyboard(' ');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(3);
    await expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.tab();
    await expect(canvas.getByRole('textbox', { name: 'After button' })).toHaveFocus();
  },
};

export const Disabled: Story = {
  args: { disabled: true, onClick: fn() },
  render: renderInForm,
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: 'Checks that disabled buttons cannot activate and are skipped by Tab.',
      },
    },
  },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole('button', { name: args.label });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();

    canvas.getByRole('textbox', { name: 'Before button' }).focus();
    await userEvent.tab();
    await expect(canvas.getByRole('textbox', { name: 'After button' })).toHaveFocus();
  },
};
