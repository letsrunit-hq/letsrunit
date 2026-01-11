import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';
import { AntdDatePicker, AntdRangePicker } from '../../src/antd/datepicker';

test.describe('Ant Design DatePicker', () => {
  test('select date with defaults', async ({ mount, page }) => {
    await mount(<AntdDatePicker />);

    await setFieldValue(page.getByLabel('datepicker'), new Date('2024-07-15'), { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Mon Jul 15 2024');
  });

  test('select date with custom format', async ({ mount, page }) => {
    await mount(<AntdDatePicker format="DD/MM/YYYY" />);

    await setFieldValue(page.getByLabel('datepicker'), new Date('2024-03-02'), { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Sat Mar 02 2024');
  });

  test('select date in the past', async ({ mount, page }) => {
    await mount(<AntdDatePicker />);

    await setFieldValue(page.getByLabel('datepicker'), new Date('2023-12-05'), { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Tue Dec 05 2023');
  });

  test('select date in the future', async ({ mount, page }) => {
    await mount(<AntdDatePicker />);

    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    date.setMonth(5);
    date.setDate(20);

    await setFieldValue(page.getByLabel('datepicker'), date, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date.toDateString());
  });
});

test.describe('Ant Design RangePicker', () => {
  test('select range', async ({ mount, page }) => {
    await mount(<AntdRangePicker />);

    const dates = { from: new Date('2024-07-15'), to: new Date('2024-07-18') };

    await setFieldValue(page.getByLabel('rangepicker'), dates, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('From: Mon Jul 15 2024');
    await expect(page.getByLabel('result')).toContainText('To: Thu Jul 18 2024');
  });

  test('select range with custom format', async ({ mount, page }) => {
    await mount(<AntdRangePicker format="DD/MM/YYYY" />);

    const dates = { from: new Date('2024-03-02'), to: new Date('2024-03-04') };

    await setFieldValue(page.getByLabel('rangepicker'), dates, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('From: Sat Mar 02 2024');
    await expect(page.getByLabel('result')).toContainText('To: Mon Mar 04 2024');
  });
});
