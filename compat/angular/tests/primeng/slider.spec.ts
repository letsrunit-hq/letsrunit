import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import { PrimeNgSliderFixture } from '../../src/primeng/slider';
import { registerHtmlDump } from '../ng-zorro-antd/debug-html';

registerHtmlDump(test);

test.describe('PrimeNG Slider', () => {
  test('set to higher value', async ({ mount, page }) => {
    await mount(PrimeNgSliderFixture);

    await setFieldValue(page.locator('p-slider'), 80, { timeout: 1000 });
    await expect(page.getByLabel('result')).toContainText('80');
  });

  test('set to lower value', async ({ mount, page }) => {
    await mount(PrimeNgSliderFixture);

    await setFieldValue(page.locator('p-slider'), 3, { timeout: 1000 });
    await expect(page.getByLabel('result')).toContainText('3');
  });
});
