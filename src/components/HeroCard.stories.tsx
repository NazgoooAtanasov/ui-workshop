import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { HeroCard } from '../index';

const meta = {
  title: 'Components/HeroCard',
  component: HeroCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: { description: { component:
      'The [Figma Hero Card](https://www.figma.com/design/URreSeq8ZUhiQVdQbFqhFr/Figma2RepoPoc?node-id=14-452). Four surfaces composed with the existing Button. The consumer supplies the action through buttonProps. Explicit Button overrides persist across card variants. headingLevel defaults to 2; native section props and ref pass through.',
    } },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'tinted', 'compact', 'dark'] },
    headingLevel: { control: 'select', options: [1, 2, 3, 4, 5, 6] },
    className: { control: false },
    ref: { control: false },
  },
  args: {
    variant: 'default',
    eyebrow: 'BUILT FOR YOUR NEXT IDEA',
    heading: 'Make room for what’s next.',
    description: 'Bring your next project to life with a clear starting point and a little momentum.',
    buttonProps: { onClick: fn() },
  },
} satisfies Meta<typeof HeroCard>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Tinted: Story = { args: { variant: 'tinted' } };
export const Compact: Story = { args: { variant: 'compact' } };
export const Dark: Story = { args: { variant: 'dark' } };
export const StyleMatrix: Story = {
  parameters: { layout: 'padded', controls: { include: ['eyebrow', 'heading', 'description', 'buttonProps'] } },
  render: (args) => (
    <div className="grid grid-cols-[repeat(2,minmax(0,640px))] items-start gap-x-[80px] gap-y-[120px] p-space-20 [@media(max-width:900px)]:grid-cols-[minmax(0,640px)] [@media(max-width:900px)]:gap-space-32">
      {(['default', 'tinted', 'compact', 'dark'] as const).map((variant) => (
        <HeroCard {...args} key={variant} variant={variant} />
      ))}
    </div>
  ),
};
export const FlexibleWidth: Story = {
  parameters: { layout: 'padded' },
  render: (args) => <div className="w-hero-width min-w-[200px] max-w-full overflow-auto resize-x"><HeroCard {...args} /></div>,
};
export const ButtonOverrides: Story = {
  args: { buttonProps: { label: 'Explore the possibilities', variant: 'secondary', size: 'small', onClick: fn() } },
};
export const KeyboardAndPointer: Story = {
  args: { buttonProps: { onClick: fn() } },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByRole('region')).toHaveAccessibleName(args.heading);
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent(args.heading ?? 'Make room for what’s next.');
    const button = canvas.getByRole('button', { name: 'Get started' });
    button.blur();
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await userEvent.click(button);
    await expect(args.buttonProps?.onClick).toHaveBeenCalledTimes(3);
  },
};
export const Disabled: Story = {
  args: { variant: 'dark', buttonProps: { disabled: true, onClick: fn() } },
  render: (args) => (
    <div className="flex flex-col items-start gap-space-16">
      <button type="button">Before card</button>
      <HeroCard {...args} />
      <button type="button">After card</button>
    </div>
  ),
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole('button', { name: 'Get started' });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.buttonProps?.onClick).not.toHaveBeenCalled();
    canvas.getByRole('button', { name: 'Before card' }).focus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After card' })).toHaveFocus();
  },
};
