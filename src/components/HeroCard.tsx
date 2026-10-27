import { useId, type ComponentProps } from 'react';
import { Button, type ButtonProps } from './Button.js';
import { cn } from '../cn.js';

const variantClasses = {
  default: 'border-border-default bg-surface-default text-text-primary',
  tinted: 'border-border-accent bg-surface-tinted text-text-primary',
  compact:
    'border-border-default bg-surface-default text-text-primary w-hero-compact-width gap-hero-compact-gap p-hero-compact-padding',
  dark: 'border-border-dark bg-surface-dark text-text-inverse',
};

export type HeroCardProps = Omit<ComponentProps<'section'>, 'children'> & {
  variant?: 'default' | 'tinted' | 'compact' | 'dark';
  eyebrow?: string;
  heading?: string;
  description?: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Props for the existing Button; explicit overrides persist across card styles. */
  buttonProps?: Omit<ButtonProps, 'label'> & { label?: string };
};

/** Text-first hero with a native action supplied by the consumer. */
export const HeroCard = ({
  variant = 'default',
  eyebrow = 'BUILT FOR YOUR NEXT IDEA',
  heading = 'Make room for what’s next.',
  description = 'Bring your next project to life with a clear starting point and a little momentum.',
  headingLevel = 2,
  buttonProps,
  className,
  'aria-labelledby': labelledBy,
  ...sectionProps
}: HeroCardProps) => {
  const headingId = useId();
  const Heading = `h${headingLevel}` as const;

  return (
    <section
      {...sectionProps}
      className={cn(
        'box-border flex flex-col items-stretch gap-hero-gap w-hero-width max-w-full min-w-0 p-hero-padding border-(length:--poc-size-border-width) border-solid rounded-card font-ui not-italic tracking-normal [overflow-wrap:anywhere]',
        '[@media(max-width:480px)]:p-hero-compact-padding',
        variantClasses[variant],
        className,
      )}
      aria-labelledby={labelledBy ?? headingId}
    >
      <p className="m-0 text-label font-bold">{eyebrow}</p>
      <Heading
        className={cn(
          'm-0 font-bold text-heading',
          variant === 'compact' && 'text-heading-compact',
        )}
        id={headingId}
      >
        {heading}
      </Heading>
      <p
        className={cn(
          'm-0 text-body font-regular text-text-secondary',
          variant === 'dark' && 'text-text-on-dark',
        )}
      >
        {description}
      </p>
      <Button
        variant={variant === 'dark' ? 'secondary' : 'primary'}
        size="medium"
        {...buttonProps}
        label={buttonProps?.label ?? 'Get started'}
        className={cn(
          'max-w-full h-auto whitespace-normal [overflow-wrap:anywhere]',
          variant === 'tinted' || variant === 'dark' ? 'self-start' : 'self-end',
          buttonProps?.size === 'small'
            ? 'min-h-button-small-height py-button-small-padding-block'
            : 'min-h-control-height py-button-medium-padding-block',
          buttonProps?.className,
        )}
      />
    </section>
  );
};
