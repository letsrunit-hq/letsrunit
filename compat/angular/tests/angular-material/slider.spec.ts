import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import { MatSliderFixture } from '../../src/angular-material/slider';

test.describe('Mat Slider', () => {
  test('set to higher value', async ({ mount, page }) => {
    await mount(MatSliderFixture);

    await setFieldValue(page.getByRole('slider'), 80, { timeout: 1000 });
    await expect(page.getByLabel('result')).toContainText('80');
  });

  test('set to lower value', async ({ mount, page }) => {
    await mount(MatSliderFixture);

    await setFieldValue(page.getByRole('slider'), 3, { timeout: 1000 });
    await expect(page.getByLabel('result')).toContainText('3');
  });
});
