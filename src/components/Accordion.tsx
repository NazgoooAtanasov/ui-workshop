import type { ComponentProps } from 'react';
import { cn } from '../cn.js';
import collapsedChevron from '../assets/accordion-chevron-collapsed.svg';
import expandedChevron from '../assets/accordion-chevron-expanded.svg';

export type AccordionProps = Omit<ComponentProps<'details'>, 'children' | 'content'> & {
  summary?: string;
  content?: string;
};

/** A native disclosure; open, onToggle, name, and ref pass through to details. */
export const Accordion = ({
  summary = 'How do I get started?',
  content = 'Choose a starting point, make it your own, and take the next step when you’re ready.',
  className,
  ...detailsProps
}: AccordionProps) => (
  <details
    {...detailsProps}
    className={cn(
      'group box-border w-accordion-width max-w-full min-w-0 m-0 p-accordion-padding border-(length:--poc-size-border-width) border-solid border-border-default rounded-card bg-surface-default text-text-primary font-ui text-body font-regular not-italic tracking-normal [overflow-wrap:anywhere]',
      className,
    )}
  >
    <summary className="flex items-center gap-space-8 list-none rounded-control font-bold cursor-pointer [&::-webkit-details-marker]:hidden hover:bg-surface-hover focus-visible:bg-surface-tinted focus-visible:outline-none focus-visible:ring-(length:--poc-size-focus-ring) focus-visible:ring-focus-ring focus-visible:ring-offset-[length:var(--poc-size-focus-gap)] focus-visible:ring-offset-focus-gap">
      <span className="min-w-0 flex-1">{summary}</span>
      <span className="flex size-icon-size shrink-0 items-center justify-center" aria-hidden="true">
        <img src={collapsedChevron} alt="" className="block group-open:hidden" />
        <img src={expandedChevron} alt="" className="hidden rotate-180 group-open:block" />
      </span>
    </summary>
    <p className="mb-0 mt-accordion-gap text-text-secondary">{content}</p>
  </details>
);
