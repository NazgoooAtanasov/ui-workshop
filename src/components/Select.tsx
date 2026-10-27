import { useId, type ComponentProps } from 'react';

export type SelectProps = Omit<
  ComponentProps<'select'>,
  'multiple' | 'size' | 'value' | 'defaultValue'
> & {
  /** Visible text associated with the native select. */
  label: string;
  /** Supporting text included in the select's accessible description. */
  hint?: string;
  /** Empty option prompt; the initial selection has an empty value. */
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  /** Applied to the field wrapper to customize its layout and width. */
  className?: string;
};

/** The Figma single-select field, with native options and interactions. */
export const Select = ({
  label,
  hint,
  placeholder = 'Select a country',
  id,
  disabled,
  className,
  children,
  defaultValue = '',
  'aria-describedby': describedBy,
  ...selectProps
}: SelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = `${selectId}-hint`;

  return (
    <div
      className={['poc-select', disabled && 'poc-select--disabled', className]
        .filter(Boolean)
        .join(' ')}
    >
      <label className="poc-select__label" htmlFor={selectId}>
        {label}
      </label>
      <select
        {...selectProps}
        defaultValue={selectProps.value === undefined ? defaultValue : undefined}
        id={selectId}
        className="poc-select__control"
        disabled={disabled}
        aria-describedby={
          [describedBy, hint ? hintId : undefined].filter(Boolean).join(' ') || undefined
        }
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      {hint && (
        <p className="poc-select__hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
};
