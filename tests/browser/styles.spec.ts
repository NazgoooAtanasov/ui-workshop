import { expect, test, type Page } from '@playwright/test';

async function story(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.locator('#storybook-root')).not.toBeEmpty();
}

test('Button keeps its sizes, native states and token-driven focus ring', async ({ page }) => {
  await story(page, 'components-button--primary-small');
  const button = page.getByRole('button', { name: 'Continue' });
  await expect(button).toHaveCSS('height', '36px');
  await expect(button).toHaveCSS('border-radius', '10px');
  await expect(button).toHaveCSS('font-size', '14px');
  await expect(button).toHaveCSS('line-height', '20px');
  await expect(button).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
  await button.hover();
  await expect(button).toHaveCSS('background-color', 'rgb(38, 38, 38)');
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS('box-shadow', /173, 168, 255.*5px/);

  await story(page, 'components-button--primary-medium');
  await expect(button).toHaveCSS('height', '48px');
  await expect(button).toHaveCSS('padding-inline-start', '24px');
  await expect(button).toHaveCSS('font-size', '16px');

  await story(page, 'components-button--disabled');
  await expect(button).toBeDisabled();
  await expect(button).toHaveCSS('background-color', 'rgb(229, 231, 235)');
  await expect(button).toHaveCSS('color', 'rgb(107, 114, 128)');
});

test('Input preserves native editing and focus takes precedence over hover', async ({ page }) => {
  await story(page, 'components-input--default');
  const input = page.getByRole('textbox', { name: 'Email address' });
  await expect(input).toHaveCSS('height', '48px');
  await expect(input).toHaveCSS('width', '320px');
  await expect(input).toHaveCSS('border-radius', '12px');
  await input.hover();
  await expect(input).toHaveCSS('background-color', 'rgb(250, 250, 250)');
  await input.fill('alex@example.com');
  await expect(input).toHaveCSS('background-color', 'rgb(245, 243, 255)');
  await expect(input).toHaveCSS('border-color', 'rgb(0, 0, 0)');
  await expect(input).toHaveAccessibleDescription('Use your work email address.');
  await page.getByText('Email address', { exact: true }).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('alex@example.com');

  await story(page, 'components-input--disabled');
  await expect(input).toBeDisabled();
  await expect(input).toHaveCSS('background-color', 'rgb(243, 244, 246)');
});

test('Select keeps native selection and a token-colored decorative chevron', async ({ page }) => {
  await story(page, 'components-select--default');
  const select = page.getByRole('combobox', { name: 'Country' });
  await expect(select).toHaveCSS('height', '48px');
  await expect(select).toHaveCSS('color', 'rgb(107, 114, 128)');
  const chevron = page.locator('#storybook-root svg');
  await expect(chevron).toHaveCSS('width', '20px');
  await expect(chevron).toHaveCSS('stroke-width', '1.5px');
  await expect(chevron).toHaveCSS('color', 'rgb(17, 24, 39)');
  await select.selectOption('de');
  await expect(select).toHaveValue('de');
  await expect(select).toHaveCSS('color', 'rgb(17, 24, 39)');
  await page.getByText('Country', { exact: true }).click();
  await expect(select).toBeFocused();
  await expect(select).toHaveCSS('background-color', 'rgb(245, 243, 255)');

  await story(page, 'components-select--disabled');
  await expect(select).toBeDisabled();
  await expect(select).toHaveCSS('color', 'rgb(156, 163, 175)');
  await expect(chevron).toHaveCSS('color', 'rgb(156, 163, 175)');
});

test('Hero Card variants retain geometry and withstand consumer element styles', async ({
  page,
}) => {
  for (const variant of ['default', 'tinted', 'compact', 'dark']) {
    await story(page, `components-herocard--${variant}`);
    // The consumer has ordinary, unlayered heading styles.
    await page.addStyleTag({
      content: 'h2 { font-size: 17px; font-weight: 400; line-height: 1.4; margin-bottom: 12px; }',
    });
    const card = page.getByRole('region');
    const heading = card.getByRole('heading');
    await expect(card).toHaveCSS('width', variant === 'compact' ? '480px' : '640px');
    await expect(card).toHaveCSS('padding', variant === 'compact' ? '24px' : '32px');
    await expect(heading).toHaveCSS('font-size', variant === 'compact' ? '28px' : '36px');
    await expect(heading).toHaveCSS('font-weight', '700');
    await expect(heading).toHaveCSS('margin', '0px');
    await expect(card.getByRole('button')).toHaveCSS(
      'align-self',
      variant === 'tinted' || variant === 'dark' ? 'flex-start' : 'flex-end',
    );
    if (variant === 'dark') await expect(card).toHaveCSS('background-color', 'rgb(17, 24, 39)');
    if (variant === 'tinted')
      await expect(card).toHaveCSS('background-color', 'rgb(245, 243, 255)');
  }
});

test('consumer classes override defaults on roots, controls and nested actions', async ({
  page,
}) => {
  await story(page, 'foundations-theme--consumer-overrides');
  const button = page.getByRole('button', { name: 'Full width, rounded action' });
  await expect(button).toHaveClass(/rounded-full/);
  await expect(button).not.toHaveClass(/rounded-control/);
  await expect(button).toHaveCSS('padding-inline-start', '32px');
  const input = page.getByRole('textbox', { name: 'Custom field' });
  await expect(input).toHaveCSS('font-size', '14px');
  await expect(input).toHaveCSS('color', 'rgb(17, 24, 39)');
  await expect(input).toHaveCSS('background-color', 'rgb(245, 243, 255)');
  expect(
    await input.evaluate((element) => parseFloat(getComputedStyle(element).borderRadius)),
  ).toBeGreaterThan(1000);
  const card = page.getByRole('region');
  await expect(card).toHaveCSS('border-radius', '10px');
  await expect(card.getByRole('button')).toHaveCSS('align-self', 'stretch');
});

test('shared token updates propagate without rebuilding components', async ({ page }) => {
  await story(page, 'components-button--primary-medium');
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--poc-palette-black', '#123456');
    document.documentElement.style.setProperty('--poc-radius-control', '18px');
  });
  const button = page.getByRole('button', { name: 'Continue' });
  await expect(button).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await expect(button).toHaveCSS('border-radius', '18px');
});

test('cards fit small screens and long action labels wrap inside their padding', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await story(page, 'components-herocard--flexible-width');
  const card = page.getByRole('region');
  await expect(card).toHaveCSS('padding', '24px');
  await card.locator('..').evaluate((element) => {
    element.style.width = '200px';
  });
  await expect(card).toHaveCSS('width', '200px');
  const button = card.getByRole('button');
  await button.evaluate((element) => {
    element.textContent = 'ExploreAllOfTheAvailablePossibilitiesWithoutOverflowing';
  });
  const action = await button.boundingBox();
  const bounds = await card.boundingBox();
  expect(action!.height).toBeGreaterThan(48);
  expect(action!.width).toBeLessThanOrEqual(bounds!.width - 48);
  await expect(button).toHaveCSS('padding-block-start', '11px');
});

test('interaction transitions respect reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await story(page, 'components-button--primary-small');
  await expect(page.getByRole('button', { name: 'Continue' })).toHaveCSS(
    'transition-property',
    'none',
  );
});

test('review matrices show the forced hover and focus states used for approval', async ({
  page,
}) => {
  await story(page, 'components-button--state-matrix');
  await expect(page.locator('button[data-figma-state="hover"]').first()).toHaveCSS(
    'background-color',
    'rgb(38, 38, 38)',
  );
  await expect(page.locator('button[data-figma-state="focus"]').first()).toHaveCSS(
    'box-shadow',
    /173, 168, 255.*5px/,
  );
  for (const component of ['input', 'select']) {
    await story(page, `components-${component}--state-matrix`);
    await expect(page.locator(`${component}[data-figma-state="hover"]`)).toHaveCSS(
      'background-color',
      'rgb(250, 250, 250)',
    );
    await expect(page.locator(`${component}[data-figma-state="focus"]`)).toHaveCSS(
      'background-color',
      'rgb(245, 243, 255)',
    );
  }
});
