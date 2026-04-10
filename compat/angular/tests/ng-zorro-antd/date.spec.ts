import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import { NzDatepickerFixture, NzDateRangePickerFixture } from '../../src/ng-zorro-antd/date';
test.describe('Nz Datepicker', () => {
  test('select date', async ({ mount, page }) => {
    test.skip(
      true,
      'Skipped: nz-date-picker does not expose stable generic composite semantics for committed state, so setFieldValue cannot reliably verify model commit yet.',
    );

    await mount(NzDatepickerFixture);

    await setFieldValue(page.locator('nz-date-picker input').first(), new Date('2024-07-15'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('2024-07-15');
  });

  test('select range', async ({ mount, page }) => {
    test.skip(
      true,
      'Skipped: nz-range-picker group wrapper lacks generic ARIA/date-group semantics and currently falls through to fallback in setFieldValue.',
    );

    await mount(NzDateRangePickerFixture);

    await setFieldValue(
      page.getByLabel('date-range-group'),
      { from: new Date('2024-02-10'), to: new Date('2024-02-20') },
      { timeout: 5000 },
    );
    await expect(page.getByLabel('result')).toContainText('2024-02-10 - 2024-02-20');
  });
});
