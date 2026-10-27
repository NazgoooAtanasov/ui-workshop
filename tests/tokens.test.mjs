import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { readTokens, generateTheme } from '../scripts/tokens.ts';
import { cn } from '../src/cn.ts';

test('native Figma numbers normalize to dimensions while weights and durations keep their meanings', () => {
  const tokens = readTokens({
    space: { 8: { $type: 'number', $value: 8 } },
    layout: { gap: { $type: 'number', $value: '{space.8}' } },
    font: { weight: { regular: { $type: 'number', $value: 400 } } },
    motion: { duration: { interaction: { $type: 'number', $value: 120 } } },
    $extensions: { figma: { collectionId: 'ignored metadata' } },
  });
  const { css } = generateTheme(tokens);
  assert.match(css, /--poc-space-8: 8px;/);
  assert.match(css, /--poc-layout-gap: var\(--poc-space-8\);/);
  assert.match(css, /--poc-font-weight-regular: 400;/);
  assert.match(css, /--poc-motion-duration-interaction: 120ms;/);
});

test('broken, cyclic, mistyped and colliding token references fail before generating CSS', () => {
  assert.throws(
    () => readTokens({ a: { $type: 'number', $value: '{missing}' } }),
    /Missing token reference/,
  );
  assert.throws(
    () =>
      readTokens({ a: { $type: 'number', $value: '{b}' }, b: { $type: 'number', $value: '{a}' } }),
    /Circular token reference/,
  );
  assert.throws(
    () =>
      readTokens({
        a: { $type: 'number', $value: '{b}' },
        b: { $type: 'string', $value: 'Inter' },
      }),
    /types differ/,
  );
  assert.throws(
    () =>
      readTokens({
        'a-b': { $type: 'number', $value: 1 },
        a: { b: { $type: 'number', $value: 2 } },
      }),
    /Duplicate CSS token name/,
  );
});

test('the shared theme preserves aliases and distinguishes custom typography from colors', () => {
  const source = JSON.parse(
    readFileSync(new URL('../tokens/theme.tokens.json', import.meta.url), 'utf8'),
  );
  const tokens = readTokens(source);
  const { css } = generateTheme(tokens);
  assert.equal(tokens.size, 102);
  assert.match(css, /--poc-color-action-primary-background: var\(--poc-palette-black\);/);
  assert.match(css, /--text-body: var\(--poc-font-size-body\);/);
  assert.match(css, /--text-body--line-height: var\(--poc-font-line-height-body\);/);

  assert.equal(
    cn('text-body text-text-primary font-ui font-regular', 'text-label font-bold'),
    'text-text-primary font-ui text-label font-bold',
  );
  assert.equal(
    cn(
      'h-control-height px-button-medium-padding-inline rounded-control',
      'h-auto px-space-32 rounded-full',
    ),
    'h-auto px-space-32 rounded-full',
  );
  assert.equal(cn('duration-interaction', 'duration-300'), 'duration-300');
  assert.equal(
    cn(
      'focus-visible:ring-offset-[length:var(--poc-size-focus-gap)]',
      'focus-visible:ring-offset-focus-gap',
    ),
    'focus-visible:ring-offset-[length:var(--poc-size-focus-gap)] focus-visible:ring-offset-focus-gap',
  );
  assert.equal(
    cn('bg-action-primary-background enabled:hover:bg-action-primary-hover', 'bg-surface-tinted'),
    'enabled:hover:bg-action-primary-hover bg-surface-tinted',
  );
  assert.equal(
    cn('flex', { 'w-full': true, hidden: false }, [null, undefined, 'consumer-class']),
    'flex w-full consumer-class',
  );
});
