import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import { NzDatepickerFixture, NzDateRangePickerFixture } from '../../src/angular-zorro/date';

test.describe('Nz Datepicker', () => {
  test('select date', async ({ mount, page }) => {
    await mount(NzDatepickerFixture);

    await setFieldValue(page.locator('nz-date-picker input').first(), new Date('2024-07-15'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('2024-07-15');
  });

  test('select range', async ({ mount, page }) => {
    await mount(NzDateRangePickerFixture);

    await setFieldValue(
      page.getByLabel('date-range-group'),
      { from: new Date('2024-02-10'), to: new Date('2024-02-20') },
      { timeout: 5000 },
    );
    await expect(page.getByLabel('result')).toContainText('2024-02-10 - 2024-02-20');
  });
});
