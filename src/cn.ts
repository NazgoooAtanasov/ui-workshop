import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { mergeTheme } from './generated/merge-theme.ts';

const merge = extendTailwindMerge({
  extend: {
    theme: mergeTheme,
    classGroups: { duration: ['duration-interaction'] },
  },
});

/** Merge defaults, variants, and consumer overrides, with consumer classes last. */
export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
