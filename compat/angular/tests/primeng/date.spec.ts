import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import { PrimeNgDatePickerFixture, PrimeNgDatePickerInlineFixture } from '../../src/primeng/date';
import { registerHtmlDump } from '../ng-zorro-antd/debug-html';

registerHtmlDump(test);

test.describe('PrimeNG DatePicker', () => {
  test('select date with defaults', async ({ mount, page }) => {
    await mount(PrimeNgDatePickerFixture);

    await setFieldValue(page.getByLabel('datepicker'), new Date('2024-07-15'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('Mon Jul 15 2024');
  });

  test('select date in the past', async ({ mount, page }) => {
    await mount(PrimeNgDatePickerFixture);

    await setFieldValue(page.getByLabel('datepicker'), new Date('2023-12-05'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('Tue Dec 05 2023');
  });
});

test.describe('PrimeNG DatePicker (inline)', () => {
  test('select date', async ({ mount, page }) => {
    await mount(PrimeNgDatePickerInlineFixture);

    await setFieldValue(page.locator('p-datepicker'), new Date('2024-07-15'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('Mon Jul 15 2024');
  });

  test('select date in the past', async ({ mount, page }) => {
    await mount(PrimeNgDatePickerInlineFixture);

    await setFieldValue(page.locator('p-datepicker'), new Date('2023-12-05'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('Tue Dec 05 2023');
  });
});
