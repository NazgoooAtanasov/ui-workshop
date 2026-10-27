import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, HeroCard, Input, Select, cn } from '../index';

const states = ['default', 'hover', 'focus', 'disabled'] as const;

function ThemePreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'box-border flex flex-col gap-space-32 max-w-full p-space-24 font-ui text-text-primary',
        className,
      )}
    >
      <section className="overflow-x-auto p-space-8">
        <h2 className="m-0 mb-space-16 text-heading-compact font-bold">Button</h2>
        <div className="grid grid-cols-4 gap-space-24 items-center">
          {(['primary', 'secondary'] as const).flatMap((variant) =>
            (['small', 'medium'] as const).flatMap((size) =>
              states.map((state) => (
                <div
                  key={`${variant}-${size}-${state}`}
                  className="flex flex-col items-start gap-space-8"
                >
                  <span className="text-caption">
                    {variant} / {size} / {state}
                  </span>
                  <Button
                    label="Continue"
                    variant={variant}
                    size={size}
                    disabled={state === 'disabled'}
                    data-figma-state={state}
                  />
                </div>
              )),
            ),
          )}
        </div>
      </section>
      <section>
        <h2 className="m-0 mb-space-16 text-heading-compact font-bold">Native fields</h2>
        <div className="flex flex-wrap gap-space-32">
          {states.map((state) => (
            <div key={state} className="flex flex-col gap-space-24 min-w-0 max-w-full p-space-8">
              <span className="text-caption capitalize">{state}</span>
              <Input
                label="Email address"
                placeholder="you@example.com"
                hint="Use your work email."
                disabled={state === 'disabled'}
                data-figma-state={state}
              />
              <Select
                label="Country"
                hint="Choose your country."
                disabled={state === 'disabled'}
                data-figma-state={state}
              >
                <option value="bg">Bulgaria</option>
                <option value="de">Germany</option>
              </Select>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="m-0 mb-space-16 text-heading-compact font-bold">Hero Card</h2>
        <div className="flex flex-wrap items-start gap-space-32">
          {(['default', 'tinted', 'compact', 'dark'] as const).map((variant) => (
            <HeroCard key={variant} variant={variant} />
          ))}
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: 'Foundations/Theme',
  component: ThemePreview,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'The 102-token Figma Theme, compiled into Tailwind utilities. Review every affected component and its interactions before approving a shared theme revision. The Theme approval on this page covers the complete branch revision, including all components shown here.',
      },
    },
    pseudo: {
      hover: '[data-figma-state="hover"]',
      focus: 'input[data-figma-state="focus"], select[data-figma-state="focus"]',
      focusVisible: 'button[data-figma-state="focus"]',
    },
  },
} satisfies Meta<typeof ThemePreview>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};

export const ConsumerOverrides: Story = {
  parameters: { pseudo: {} },
  render: () => (
    <div className="box-border flex flex-col items-start gap-space-24 w-hero-width max-w-full p-space-24">
      <Button
        label="Full width, rounded action"
        size="medium"
        className="w-full rounded-full px-space-32"
      />
      <Input
        label="Custom field"
        className="w-full"
        controlClassName="rounded-full bg-surface-tinted text-label"
      />
      <Select label="Custom selection" className="w-full" controlClassName="rounded-full">
        <option value="bg">Bulgaria</option>
      </Select>
      <HeroCard
        className="w-full rounded-small"
        buttonProps={{ className: 'self-stretch rounded-full' }}
      />
    </div>
  ),
};
