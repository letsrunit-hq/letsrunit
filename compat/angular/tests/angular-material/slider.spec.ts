import { expect, test } from '@sand4rt/experimental-ct-angular';
import type { Locator } from 'playwright/test';
import { MatSliderFixture } from '../../src/angular-material/slider';

async function setSliderValueByKeyboard(slider: Locator, value: number): Promise<void> {
  await slider.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

test.describe('Mat Slider', () => {
  test('set to higher value', async ({ mount, page }) => {
    await mount(MatSliderFixture);

    await setSliderValueByKeyboard(page.getByRole('slider'), 80);
    await expect(page.getByLabel('result')).toContainText('80');
  });

  test('set to lower value', async ({ mount, page }) => {
    await mount(MatSliderFixture);

    await setSliderValueByKeyboard(page.getByRole('slider'), 3);
    await expect(page.getByLabel('result')).toContainText('3');
  });
});
