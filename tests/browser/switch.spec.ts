import { expect, test } from '@playwright/test';

test('Switch supports native keyboard, label, controlled and disabled behavior', async ({ page }) => {
  await page.goto('/iframe.html?id=components-switch--default&viewMode=story');
  const control = page.getByRole('switch', { name: 'Notifications' });
  await expect(control).not.toBeChecked();
  await expect(control.locator('..')).toHaveCSS('min-height', '48px');
  await page.keyboard.press('Tab');
  await expect(control).toBeFocused();
  await page.keyboard.press('Space');
  await expect(control).toBeChecked();
  await page.keyboard.press('Enter');
  await expect(control).not.toBeChecked();
  const label = control.locator('..');
  await label.click({ position: { x: 90, y: 24 } });
  await expect(control).toBeChecked();
  await expect(control).toHaveAccessibleName('Notifications');
  await page.goto('/iframe.html?id=components-switch--controlled&viewMode=story');
  await control.click();
  await expect(control).toBeChecked();
  await control.click();
  await expect(control).not.toBeChecked();
  await page.goto('/iframe.html?id=components-switch--disabled&viewMode=story');
  await expect(control).toBeDisabled();
  await page.getByText('Before switch').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByText('After switch')).toBeFocused();
});

test('Switch renders all eight Figma assets at their native dimensions', async ({ page }) => {
  await page.goto('/iframe.html?id=components-switch--state-matrix&viewMode=story');
  await expect(page.getByRole('switch')).toHaveCount(8);
  await page.evaluate(() => document.fonts.ready);
  const rows = page.locator('#storybook-root label');
  for (let index = 0; index < 8; index++) {
    const images = rows.nth(index).locator('img');
    const visible = images.filter({ visible: true });
    // Opacity selects the state without changing image dimensions or track placement.
    const rendered = () => visible.evaluateAll((elements) => elements.filter((element) => getComputedStyle(element).opacity === '1').map((element) => {
      const image = element as HTMLImageElement;
      return { loaded: image.complete && image.naturalWidth > 0, width: image.width, height: image.height };
    }));
    const expected = index === 0 ? { width: 46, height: 26 } : index === 4 || index === 5 ? { width: 54, height: 34 } : { width: 44, height: 24 };
    await expect.poll(rendered).toEqual([{ loaded: true, ...expected }]);
  }
  await page.screenshot({ path: '/tmp/switch-implementation.png' });
});
