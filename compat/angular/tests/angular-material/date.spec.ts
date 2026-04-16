import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import { MatDatepickerFixture } from '../../src/angular-material/date';

test.describe('Mat Datepicker', () => {
  test('select date with defaults', async ({ mount, page }) => {
    await mount(MatDatepickerFixture);

    await setFieldValue(page.getByLabel('datepicker'), new Date('2024-07-15'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('Mon Jul 15 2024');
  });

  test('select date in the past', async ({ mount, page }) => {
    await mount(MatDatepickerFixture);

    await setFieldValue(page.getByLabel('datepicker'), new Date('2023-12-05'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('Tue Dec 05 2023');
  });
});
