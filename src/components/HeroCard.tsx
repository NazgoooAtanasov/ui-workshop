import { useId, type ComponentProps } from 'react';
import { Button, type ButtonProps } from './Button.js';

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
      className={['poc-hero-card', `poc-hero-card--${variant}`, className].filter(Boolean).join(' ')}
      aria-labelledby={labelledBy ?? headingId}
    >
      <p className="poc-hero-card__eyebrow">{eyebrow}</p>
      <Heading className="poc-hero-card__heading" id={headingId}>{heading}</Heading>
      <p className="poc-hero-card__description">{description}</p>
      <Button
        variant={variant === 'dark' ? 'secondary' : 'primary'}
        size="medium"
        {...buttonProps}
        label={buttonProps?.label ?? 'Get started'}
        className={['poc-hero-card__action', buttonProps?.className].filter(Boolean).join(' ')}
      />
    </section>
  );
};
