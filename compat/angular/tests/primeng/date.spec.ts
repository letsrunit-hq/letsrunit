import { PrimeNgDatePickerFixture, PrimeNgDatePickerInlineFixture } from '@/primeng/date';
import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';

test.describe('PrimeNG DatePicker', () => {
  test('select date with defaults', async ({ mount, page }) => {
    await mount(PrimeNgDatePickerFixture);

    await setFieldValue(page.getByLabel('datepicker'), new Date('2024-07-15'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('Mon Jul 15 2024');
  });

  test.skip('select date in the past - ambiguous test fails because setting date in text field is flaky', async ({ mount, page }) => {
    await mount(PrimeNgDatePickerFixture);

    await setFieldValue(page.getByLabel('datepicker'), new Date('2023-12-05'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('Tue Dec 05 2023');
  });
});

test.describe('PrimeNG DatePicker (inline)', () => {
  test('select date', async ({ mount, page }) => {
    await mount(PrimeNgDatePickerInlineFixture, { hooksConfig: { noopAnimations: true } });

    await setFieldValue(page.locator('p-datepicker'), new Date('2024-07-15'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('Mon Jul 15 2024');
  });

  test('select date in the past', async ({ mount, page }) => {
    await mount(PrimeNgDatePickerInlineFixture, { hooksConfig: { noopAnimations: true } });

    await setFieldValue(page.locator('p-datepicker'), new Date('2023-12-05'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('Tue Dec 05 2023');
  });
});
