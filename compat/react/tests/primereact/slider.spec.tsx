import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';
import { PrimeReactSlider } from '../../src/primereact/slider';

test.describe('PrimeReact Slider', () => {
  test('select lower value', async ({ mount, page }) => {
    await mount(<PrimeReactSlider />);

    await setFieldValue(page.locator('.p-slider'), 30, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('30');
  });

  test('select higher value', async ({ mount, page }) => {
    await mount(<PrimeReactSlider />);

    await setFieldValue(page.locator('.p-slider'), 70, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('70');
  });
});
