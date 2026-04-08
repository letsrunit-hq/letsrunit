import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import { NzSliderFixture } from '../../src/ng-zorro-antd/slider';
import { registerHtmlDump } from './debug-html';

registerHtmlDump(test);

test.describe('Nz Slider', () => {
  test('set to higher value', async ({ mount, page }) => {
    await mount(NzSliderFixture);

    await setFieldValue(page.locator('nz-slider').first(), 80, { timeout: 1000 });
    await expect(page.getByLabel('result')).toContainText('80');
  });

  test('set to lower value', async ({ mount, page }) => {
    await mount(NzSliderFixture);

    await setFieldValue(page.locator('nz-slider').first(), 3, { timeout: 1000 });
    await expect(page.getByLabel('result')).toContainText('3');
  });
});
