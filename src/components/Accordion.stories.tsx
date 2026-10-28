import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Accordion } from '../index';

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: { description: { component:
      'The [Figma Accordion](https://www.figma.com/design/URreSeq8ZUhiQVdQbFqhFr/Figma2RepoPoc?node-id=14-489). Native details/summary supports pointer, Enter, and Space activation. Content stays mounted while collapsed and is hidden from navigation. Native details props and ref pass through; className overrides the root. Items open independently unless a shared native name is supplied.',
    } },
  },
  argTypes: { className: { control: false }, ref: { control: false } },
  args: {
    summary: 'How do I get started?',
    content: 'Choose a starting point, make it your own, and take the next step when you’re ready.',
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};
export const Expanded: Story = { args: { open: true } };
export const StateMatrix: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="flex flex-col gap-space-32 w-accordion-width max-w-full min-w-0">
      <Accordion {...args} open={false} />
      <Accordion {...args} open />
    </div>
  ),
};
export const FlexibleWidth: Story = {
  args: { open: true, className: 'w-full', summary: 'How do I choose a starting point and make it my own?' },
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="w-accordion-width min-w-[200px] max-w-full overflow-auto resize-x p-space-8 box-border">
      <Accordion {...args} />
    </div>
  ),
};
export const KeyboardAndPointer: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const summary = canvas.getByText(args.summary ?? 'How do I get started?').closest('summary')!;
    const content = canvas.getByText(args.content ?? 'Choose a starting point, make it your own, and take the next step when you’re ready.');
    await expect(content).not.toBeVisible();
    summary.blur();
    await userEvent.tab();
    await expect(summary).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(content).toBeVisible();
    await userEvent.click(content);
    await expect(content).toBeVisible();
    summary.focus();
    await userEvent.keyboard(' ');
    await expect(content).not.toBeVisible();
    await expect(summary).toHaveFocus();
    await userEvent.click(summary);
    await expect(content).toBeVisible();
  },
};
