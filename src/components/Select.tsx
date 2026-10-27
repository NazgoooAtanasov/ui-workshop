import { useId, type ComponentProps } from 'react';
import { cn } from '../cn.js';
import { fieldStyles } from './fieldStyles.js';

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
  /** Applied to the native select after its default utility classes. */
  controlClassName?: string;
};

/** The Figma single-select field, with native options and interactions. */
export const Select = ({
  label,
  hint,
  placeholder = 'Select a country',
  id,
  disabled,
  className,
  controlClassName,
  children,
  defaultValue = '',
  'aria-describedby': describedBy,
  ...selectProps
}: SelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = `${selectId}-hint`;

  return (
    <div className={cn(fieldStyles.wrapper, className)}>
      <label
        className={cn(fieldStyles.label, disabled && 'text-action-disabled-text')}
        htmlFor={selectId}
      >
        {label}
      </label>
      <div className="relative">
        <select
          {...selectProps}
          defaultValue={selectProps.value === undefined ? defaultValue : undefined}
          id={selectId}
          className={cn(
            fieldStyles.control,
            'pr-[calc(var(--poc-layout-control-padding-inline)+var(--poc-size-icon-size)+var(--poc-layout-control-gap))]',
            'has-[option[value=""]:checked]:text-text-secondary disabled:has-[option[value=""]:checked]:text-text-disabled',
            '[&_option]:bg-surface-default [&_option]:text-text-primary',
            controlClassName,
          )}
          disabled={disabled}
          aria-describedby={
            [describedBy, hint ? hintId : undefined].filter(Boolean).join(' ') || undefined
          }
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          className={cn(
            'pointer-events-none absolute right-control-padding-inline top-1/2 -translate-y-1/2 size-icon-size text-text-primary [stroke-width:var(--poc-size-icon-stroke)]',
            disabled && 'text-text-disabled',
          )}
        >
          <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {hint && (
        <p className={fieldStyles.hint} id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
};
