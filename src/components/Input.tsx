import { useId, type ComponentProps } from 'react';
import { cn } from '../cn.js';
import { fieldStyles } from './fieldStyles.js';

export type InputProps = Omit<ComponentProps<'input'>, 'children'> & {
  /** Visible text associated with the native input. */
  label: string;
  /** Supporting text included in the input's accessible description. */
  hint?: string;
  /** Applied to the field wrapper to customize its layout and width. */
  className?: string;
  /** Applied to the native input after its default utility classes. */
  controlClassName?: string;
};

/** The Figma text field, with native input state and interactions. */
export const Input = ({
  label,
  hint,
  id,
  disabled,
  className,
  controlClassName,
  'aria-describedby': describedBy,
  ...inputProps
}: InputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;

  return (
    <div className={cn(fieldStyles.wrapper, className)}>
      <label
        className={cn(fieldStyles.label, disabled && 'text-action-disabled-text')}
        htmlFor={inputId}
      >
        {label}
      </label>
      <input
        {...inputProps}
        id={inputId}
        className={cn(
          fieldStyles.control,
          'placeholder:text-text-secondary placeholder:opacity-100 disabled:placeholder:text-text-disabled',
          controlClassName,
        )}
        disabled={disabled}
        aria-describedby={
          [describedBy, hint ? hintId : undefined].filter(Boolean).join(' ') || undefined
        }
      />
      {hint && (
        <p className={fieldStyles.hint} id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
};
