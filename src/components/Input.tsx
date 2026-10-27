import { useId, type ComponentProps } from 'react';

export type InputProps = Omit<ComponentProps<'input'>, 'children'> & {
  /** Visible text associated with the native input. */
  label: string;
  /** Supporting text included in the input's accessible description. */
  hint?: string;
  /** Applied to the field wrapper to customize its layout and width. */
  className?: string;
};

/** The Figma text field, with native input state and interactions. */
export const Input = ({
  label,
  hint,
  id,
  disabled,
  className,
  'aria-describedby': describedBy,
  ...inputProps
}: InputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;

  return (
    <div
      className={['poc-input', disabled && 'poc-input--disabled', className]
        .filter(Boolean)
        .join(' ')}
    >
      <label className="poc-input__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...inputProps}
        id={inputId}
        className="poc-input__control"
        disabled={disabled}
        aria-describedby={
          [describedBy, hint ? hintId : undefined].filter(Boolean).join(' ') || undefined
        }
      />
      {hint && (
        <p className="poc-input__hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
};
