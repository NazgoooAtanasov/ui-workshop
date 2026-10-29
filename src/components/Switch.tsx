import { useId, useState, type ComponentProps } from 'react';
import { cn } from '../cn.js';
import uncheckedDefault from '../assets/switch/unchecked-default.svg';
import uncheckedHover from '../assets/switch/unchecked-hover.svg';
import uncheckedFocus from '../assets/switch/unchecked-focus.svg';
import uncheckedDisabled from '../assets/switch/unchecked-disabled.svg';
import checkedDefault from '../assets/switch/checked-default.svg';
import checkedHover from '../assets/switch/checked-hover.svg';
import checkedFocus from '../assets/switch/checked-focus.svg';
import checkedDisabled from '../assets/switch/checked-disabled.svg';

const tracks = {
  unchecked: { default: uncheckedDefault, hover: uncheckedHover, focus: uncheckedFocus, disabled: uncheckedDisabled },
  checked: { default: checkedDefault, hover: checkedHover, focus: checkedFocus, disabled: checkedDisabled },
};

export type SwitchProps = Omit<ComponentProps<'input'>, 'type' | 'role' | 'children' | 'size'> & {
  /** Omit the label only when supplying aria-label or aria-labelledby. */
  label?: string;
  showLabel?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Applied to the native checkbox after its defaults. */
  controlClassName?: string;
};

/** A native checkbox with switch semantics and an integrated clickable label. */
export const Switch = ({
  label,
  showLabel = true,
  checked,
  defaultChecked = false,
  onCheckedChange,
  onChange,
  onKeyDown,
  disabled,
  id,
  className,
  controlClassName,
  ...inputProps
}: SwitchProps) => {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const isChecked = checked ?? uncontrolledChecked;
  const assets = tracks[isChecked ? 'checked' : 'unchecked'];
  const imageClasses = 'pointer-events-none absolute left-[calc(var(--poc-size-switch-width)/2)] top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none transition-opacity duration-interaction ease-standard motion-reduce:transition-none';

  return (
    <label
      htmlFor={controlId}
      className={cn(
        'relative box-border inline-flex min-h-control-height max-w-full items-center gap-space-12 m-0 p-space-0 font-ui text-body font-regular not-italic tracking-normal text-text-primary',
        disabled && 'text-action-disabled-text',
        className,
      )}
    >
      {/* oxlint-disable jsx-a11y/role-has-required-aria-props -- Native checkbox checked supplies the switch state: https://www.w3.org/WAI/ARIA/apg/patterns/switch/ */}
      <input
        {...inputProps}
        id={controlId}
        type="checkbox"
        role="switch"
        checked={isChecked}
        disabled={disabled}
        className={cn('peer absolute inset-0 z-10 w-full h-full m-0 opacity-0 cursor-pointer disabled:cursor-not-allowed', controlClassName)}
        onChange={(event) => {
          if (checked === undefined) setUncontrolledChecked(event.currentTarget.checked);
          onChange?.(event);
          onCheckedChange?.(event.currentTarget.checked);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key === 'Enter' && !event.defaultPrevented && !event.repeat) {
            event.preventDefault();
            event.currentTarget.click();
          }
        }}
      />
      {/* oxlint-enable jsx-a11y/role-has-required-aria-props */}
      <span aria-hidden="true" className="w-switch-width h-space-24 shrink-0" />
      {disabled ? (
        <img src={assets.disabled} alt="" aria-hidden="true" className={imageClasses} />
      ) : (
        <>
          <img src={assets.default} alt="" aria-hidden="true" className={cn(imageClasses, 'peer-hover:opacity-0 peer-focus-visible:opacity-0')} />
          <img src={assets.hover} alt="" aria-hidden="true" className={cn(imageClasses, 'opacity-0 peer-hover:opacity-100 peer-focus-visible:opacity-0')} />
          <img src={assets.focus} alt="" aria-hidden="true" className={cn(imageClasses, 'opacity-0 peer-focus-visible:opacity-100')} />
        </>
      )}
      {label && <span className={cn('min-w-0 [overflow-wrap:anywhere]', !showLabel && 'sr-only')}>{label}</span>}
    </label>
  );
};
