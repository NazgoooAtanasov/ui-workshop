import type { ComponentProps } from 'react';

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
    className={[
      'poc-button',
      `poc-button--${variant}`,
      `poc-button--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {label}
  </button>
);
