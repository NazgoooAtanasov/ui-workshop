/** Shared native-field styling from the Figma Theme collection. */
export const fieldStyles = {
  wrapper:
    'flex flex-col gap-field-gap w-field-width max-w-full min-w-0 font-ui not-italic tracking-normal',
  label: 'text-text-primary text-label font-bold',
  hint: 'm-0 text-text-secondary text-caption font-regular',
  control: [
    'box-border block w-full min-w-0 h-control-height m-0 px-control-padding-inline py-0 border-(length:--poc-size-border-width) border-solid border-border-control rounded-control bg-surface-default text-text-primary font-ui text-body font-regular not-italic tracking-normal appearance-none',
    'transition-[background-color,border-color] duration-interaction ease-standard motion-reduce:transition-none',
    'enabled:hover:border-border-strong enabled:hover:bg-surface-hover',
    'enabled:focus:border-border-strong enabled:focus:bg-surface-tinted enabled:focus:outline-none enabled:focus:ring-(length:--poc-size-focus-ring) enabled:focus:ring-focus-ring enabled:focus:ring-offset-[length:var(--poc-size-focus-gap)] enabled:focus:ring-offset-focus-gap',
    'disabled:border-border-disabled disabled:bg-surface-disabled disabled:text-text-disabled disabled:cursor-not-allowed disabled:opacity-100',
  ],
};
