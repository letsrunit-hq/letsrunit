import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';
import { MuiDateCalendar, MuiDateField, MuiDatePicker } from '../../src/mui/date';

test.describe('MUI DatePicker', () => {
  test('select date with defaults', async ({ mount, page }) => {
    await mount(<MuiDatePicker />);

    await setFieldValue(page.getByLabel('datepicker'), new Date('2024-07-15'), { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Mon Jul 15 2024');
  });

  test('select date in the past', async ({ mount, page }) => {
    await mount(<MuiDatePicker />);

    await setFieldValue(page.getByLabel('datepicker'), new Date('2023-12-05'), { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Tue Dec 05 2023');
  });
});

test.describe('MUI DateCalendar', () => {
  test('select date', async ({ mount, page }) => {
    await mount(<MuiDateCalendar />);

    const date = new Date();
    date.setDate(3);

    await setFieldValue(page.locator('.MuiDateCalendar-root'), date, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date.toDateString());
  });

  test('select date 2 months ago', async ({ mount, page }) => {
    await mount(<MuiDateCalendar />);

    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    date.setDate(3);

    await setFieldValue(page.locator('.MuiDateCalendar-root'), date, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date.toDateString());
  });

  test('select date 2 months in the future', async ({ mount, page }) => {
    await mount(<MuiDateCalendar />);

    const date = new Date();
    date.setMonth(date.getMonth() + 2);
    date.setDate(3);

    await setFieldValue(page.locator('.MuiDateCalendar-root'), date, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date.toDateString());
  });

  test('select specific date in the past', async ({ mount, page }) => {
    await mount(<MuiDateCalendar />);

    const date = new Date('2024-07-15');
    
    await setFieldValue(page.locator('.MuiDateCalendar-root'), date, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date.toDateString());
  });
});

test.describe('MUI DateField', () => {
  test('select date', async ({ mount, page }) => {
    await mount(<MuiDateField />);

    await setFieldValue(page.getByLabel('datefield'), new Date('2024-07-15'), { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Mon Jul 15 2024');
  });
});
