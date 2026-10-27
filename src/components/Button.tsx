import type { ComponentProps } from 'react';
import { cn } from '../cn.js';

const variantClasses = {
  primary:
    'border-transparent bg-action-primary-background text-action-primary-text enabled:hover:bg-action-primary-hover disabled:bg-action-primary-disabled',
  secondary:
    'border-action-secondary-border bg-action-secondary-background text-action-secondary-text enabled:hover:border-action-secondary-border-hover enabled:hover:bg-action-secondary-hover disabled:border-border-disabled disabled:bg-action-secondary-disabled',
};

const sizeClasses = {
  small: 'h-button-small-height rounded-small px-button-small-padding-inline text-label',
  medium: 'h-control-height rounded-control px-button-medium-padding-inline text-body',
};

export type ButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  /** Visible text and the default accessible name. */
  label: string;
  /** Primary for the main action; secondary for supporting actions. */
  variant?: 'primary' | 'secondary';
  /** Small is 36 px high; medium is 48 px high. */
  size?: 'small' | 'medium';
};

/** The Figma action button, with native button interactions and attributes. */
export const Button = ({
  label,
  variant = 'primary',
  size = 'small',
  type = 'button',
  className,
  ...buttonProps
}: ButtonProps) => (
  <button
    {...buttonProps}
    type={type}
    className={cn(
      'box-border inline-flex items-center justify-center gap-control-gap m-0 border-(length:--poc-size-border-width) border-solid py-0 font-ui font-bold not-italic tracking-normal text-center whitespace-nowrap cursor-pointer appearance-none',
      'transition-[background-color,border-color] duration-interaction ease-standard motion-reduce:transition-none',
      'focus-visible:outline-none focus-visible:ring-(length:--poc-size-focus-ring) focus-visible:ring-focus-ring focus-visible:ring-offset-[length:var(--poc-size-focus-gap)] focus-visible:ring-offset-focus-gap',
      'disabled:text-action-disabled-text disabled:cursor-not-allowed',
      variantClasses[variant],
      sizeClasses[size],
      className,
    )}
  >
    {label}
  </button>
);
