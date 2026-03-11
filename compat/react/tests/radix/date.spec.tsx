import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';
import { RadixDatePicker } from '../../src/radix/date-picker';

test('Radix DatePicker — pick a date', async ({ mount, page }) => {
  await mount(<RadixDatePicker />);
  await setFieldValue(page.getByLabel('date'), new Date('2024-07-15'), { timeout: 500 });
  await expect(page.getByLabel('result')).toContainText('Mon Jul 15 2024');
});

test('Radix DatePicker — change date', async ({ mount, page }) => {
  await mount(<RadixDatePicker />);
  await setFieldValue(page.getByLabel('date'), new Date('2024-07-15'), { timeout: 500 });
  await setFieldValue(page.getByLabel('date'), new Date('2024-08-20'), { timeout: 500 });
  await expect(page.getByLabel('result')).toContainText('Tue Aug 20 2024');
});
