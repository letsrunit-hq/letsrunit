import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';
import { MuiSlider } from '../../src/mui/slider';

test.describe('MUI Slider', () => {
  test('set to higher value', async({ mount, page }) => {
    await mount(<MuiSlider />);

    await setFieldValue(page.getByLabel('slider'), 80, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('80');
  });

  test('set to lower value', async ({ mount, page }) => {
    await mount(<MuiSlider />);

    await setFieldValue(page.getByLabel('slider'), 3, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('3');
  });
});
