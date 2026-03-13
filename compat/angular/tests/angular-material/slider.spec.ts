import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import { MatSliderFixture } from '../../src/angular-material/slider';

test.describe('Mat Slider', () => {
  test('set to higher value', async ({ mount, page }) => {
    await mount(MatSliderFixture);

    await setFieldValue(page.getByLabel('slider'), 80, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('80');
  });

  test('set to lower value', async ({ mount, page }) => {
    await mount(MatSliderFixture);

    await setFieldValue(page.getByLabel('slider'), 3, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('3');
  });
});
