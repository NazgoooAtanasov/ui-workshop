import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { z } from 'zod';

const referenceSchema = z.string().regex(/^\{[a-zA-Z0-9_.-]+\}$/);
const tokenSchema = z.discriminatedUnion('$type', [
  z.object({
    $type: z.literal('color'),
    $value: z.object({
      colorSpace: z.literal('srgb'),
      components: z.tuple([
        z.number().min(0).max(1),
        z.number().min(0).max(1),
        z.number().min(0).max(1),
      ]),
      alpha: z.number().min(0).max(1).default(1),
      hex: z
        .string()
        .regex(/^#[a-fA-F0-9]{6}$/)
        .optional(),
    }),
    $description: z.string().optional(),
  }),
  z.object({
    $type: z.literal('dimension'),
    $value: z.object({ value: z.number(), unit: z.enum(['px', 'rem']) }),
    $description: z.string().optional(),
  }),
  z.object({ $type: z.literal('number'), $value: z.number(), $description: z.string().optional() }),
  z.object({ $type: z.literal('string'), $value: z.string(), $description: z.string().optional() }),
]);
type ValueToken = z.infer<typeof tokenSchema>;
const aliasSchema = z.object({
  $type: z.enum(['color', 'dimension', 'number', 'string']),
  $value: referenceSchema,
  $description: z.string().optional(),
});
type AliasToken = z.infer<typeof aliasSchema>;
type ReferenceToken = {
  $type: 'reference';
  valueType: ValueToken['$type'];
  target: string;
  $description?: string;
};
type Token = ValueToken | ReferenceToken;
type TokenGroup = { [name: string]: ValueToken | AliasToken | TokenGroup };

const groupSchema = z.record(z.string(), z.unknown());
const nameSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/);
const dimensionPath = /^(space|radius|size|layout|font\.(size|line-height))\./;

/** Parse portable tokens or a native Figma mode export at the JSON boundary. */
export function readTokens(input: unknown): Map<string, Token> {
  const tokens = new Map<string, Token>();
  const cssNames = new Set<string>();

  function visit(value: unknown, path: string[]) {
    const group = groupSchema.parse(value);
    if ('$value' in group) {
      const name = path.join('.');
      let token: Token;
      if (typeof group.$value === 'string' && referenceSchema.safeParse(group.$value).success) {
        const alias = aliasSchema.parse(group);
        token = {
          $type: 'reference',
          valueType:
            alias.$type === 'number' && dimensionPath.test(name) ? 'dimension' : alias.$type,
          target: alias.$value.slice(1, -1),
          $description: alias.$description,
        };
      } else {
        const value = tokenSchema.parse(group);
        // Figma exports dimensions as numbers; restore their units on import.
        token =
          value.$type === 'number' && dimensionPath.test(name)
            ? { ...value, $type: 'dimension', $value: { value: value.$value, unit: 'px' } }
            : value;
      }
      const cssName = path.join('-');
      if (cssNames.has(cssName)) throw new Error(`Duplicate CSS token name: ${cssName}`);
      cssNames.add(cssName);
      tokens.set(name, token);
      return;
    }
    for (const [name, child] of Object.entries(group)) {
      if (!name.startsWith('$')) visit(child, [...path, nameSchema.parse(name)]);
    }
  }
  visit(input, []);

  function resolve(name: string, ancestors = new Set<string>()): ValueToken {
    const token = tokens.get(name);
    if (!token) throw new Error(`Missing token reference: ${name}`);
    if (ancestors.has(name))
      throw new Error(`Circular token reference: ${[...ancestors, name].join(' → ')}`);
    if (token.$type === 'reference') {
      const target = resolve(token.target, new Set([...ancestors, name]));
      if (target.$type !== token.valueType)
        throw new Error(`Token reference types differ: ${name} → ${token.target}`);
      return target;
    }
    return token;
  }
  for (const name of tokens.keys()) resolve(name);
  return tokens;
}

function cssValue(name: string, token: Token): string {
  switch (token.$type) {
    case 'reference':
      return `var(--poc-${token.target.replaceAll('.', '-')})`;
    case 'color': {
      const channels = token.$value.components.map((channel) => Math.round(channel * 255));
      return `rgb(${channels.join(' ')} / ${token.$value.alpha})`;
    }
    case 'dimension':
      return `${token.$value.value}${token.$value.unit}`;
    case 'number':
      return `${token.$value}${name.startsWith('motion.duration.') ? 'ms' : ''}`;
    case 'string':
      return name === 'font.family' ? JSON.stringify(token.$value) : token.$value;
  }
}

export function generateTheme(tokens: Map<string, Token>): { css: string; mergeTheme: string } {
  const declarations: string[] = [];
  const theme: string[] = [];
  const text: string[] = [];
  const weights: string[] = [];
  const spacing: string[] = [];
  const radius: string[] = [];
  const leading: string[] = [];
  const ease: string[] = [];

  for (const [name, token] of tokens) {
    const path = name.replaceAll('.', '-');
    const variable = `var(--poc-${path})`;
    declarations.push(`  --poc-${path}: ${cssValue(name, token)};`);
    if ((token.$type === 'reference' ? token.valueType : token.$type) === 'color') {
      theme.push(`  --color-${path.replace(/^color-/, '')}: ${variable};`);
    } else if (name.startsWith('space.')) {
      spacing.push(path);
      theme.push(`  --spacing-${path}: ${variable};`);
    } else if (name.startsWith('size.') || name.startsWith('layout.')) {
      const scale = path.replace(/^(size|layout)-/, '');
      spacing.push(scale);
      theme.push(`  --spacing-${scale}: ${variable};`);
    } else if (name.startsWith('radius.')) {
      radius.push(name.slice('radius.'.length));
      theme.push(`  --${path}: ${variable};`);
    } else if (name === 'font.family') {
      theme.push(`  --font-ui: ${variable}, sans-serif;`);
    } else if (name.startsWith('font.weight.')) {
      weights.push(name.slice('font.weight.'.length));
      theme.push(`  --${path}: ${variable};`);
    } else if (name.startsWith('font.size.')) {
      const scale = name.slice('font.size.'.length);
      text.push(scale);
      theme.push(`  --text-${scale}: ${variable};`);
      theme.push(`  --text-${scale}--line-height: var(--poc-font-line-height-${scale});`);
    } else if (name.startsWith('font.line-height.')) {
      leading.push(name.slice('font.line-height.'.length));
      theme.push(`  --leading-${name.slice('font.line-height.'.length)}: ${variable};`);
    } else if (name.startsWith('motion.easing.')) {
      ease.push(name.slice('motion.easing.'.length));
      theme.push(`  --ease-${name.slice('motion.easing.'.length)}: ${variable};`);
    } else if (!name.startsWith('motion.duration.')) {
      throw new Error(`No Tailwind mapping for token: ${name}`);
    }
  }

  // Wrapped card actions derive vertical padding from the same Button geometry.
  for (const [size, height, lineHeight] of [
    ['small', 'size-button-small-height', 'font-line-height-label'],
    ['medium', 'size-control-height', 'font-line-height-body'],
  ]) {
    spacing.push(`button-${size}-padding-block`);
    theme.push(
      `  --spacing-button-${size}-padding-block: calc((var(--poc-${height}) - var(--poc-${lineHeight})) / 2 - var(--poc-size-border-width));`,
    );
  }

  return {
    css: [
      '/* Generated by pnpm tokens:build from tokens/theme.tokens.json. */',
      ':root {',
      ...declarations,
      '}',
      '',
      '@theme inline {',
      ...theme,
      '}',
      '',
      '@utility duration-interaction {',
      '  transition-duration: var(--poc-motion-duration-interaction);',
      '}',
      '',
    ].join('\n'),
    mergeTheme: `// Generated by pnpm tokens:build.\nexport const mergeTheme = ${JSON.stringify({ text, 'font-weight': weights, spacing, radius, leading, ease, font: ['ui'] }, null, 2)} as const;\n`,
  };
}

if (import.meta.main) {
  const source = new URL('../tokens/theme.tokens.json', import.meta.url);
  const { values } = parseArgs({ options: { import: { type: 'string' } } });
  const tokens = readTokens(JSON.parse(readFileSync(values.import ?? source, 'utf8')));
  const generated = generateTheme(tokens);
  if (values.import) {
    const portable: TokenGroup = {};
    for (const [name, token] of tokens) {
      const parts = name.split('.');
      let group = portable;
      for (const part of parts.slice(0, -1)) {
        group[part] ??= {};
        group = group[part] as TokenGroup;
      }
      group[parts.at(-1)!] =
        token.$type === 'reference'
          ? {
              $type: token.valueType,
              $value: `{${token.target}}`,
              $description: token.$description,
            }
          : token;
    }
    writeFileSync(source, `${JSON.stringify(portable, null, 2)}\n`);
  }
  const directory = new URL('../src/generated/', import.meta.url);
  mkdirSync(directory, { recursive: true });
  writeFileSync(new URL('theme.css', directory), generated.css);
  writeFileSync(new URL('merge-theme.ts', directory), generated.mergeTheme);
  console.log(`Generated the Tailwind theme from ${tokens.size} tokens.`);
}
