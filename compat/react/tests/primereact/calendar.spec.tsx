import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';
import { PrimeReactCalendar } from '../../src/primereact/calendar';

test.describe('Basic PrimeReact calendar', () => {
  test('with defaults', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar />);

    await setFieldValue(page.getByLabel('calendar'), new Date('2024-07-15'), { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Mon Jul 15 2024');
  });

  test('with custom format', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar dateFormat="d/m/y" />);

    await setFieldValue(page.getByLabel('calendar'), new Date('2024-03-02'), { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Sat Mar 02 2024');
  });

  test('with YYYY-MM-DD format', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar dateFormat="yy-mm-dd" />);

    await setFieldValue(page.getByLabel('calendar'), new Date('2024-05-20'), { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Mon May 20 2024');
  });

  test('with a max date', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar maxDate={new Date('2024-03-03')} />);

    await setFieldValue(page.getByLabel('calendar'), new Date('2024-03-02'), { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Sat Mar 02 2024');
  });

  test('with a min and custom format', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar dateFormat="d/m/y" minDate={new Date('2024-03-01')} />);

    await setFieldValue(page.getByLabel('calendar'), new Date('2024-03-02'), { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Sat Mar 02 2024');
  });

  test('with a restricted range', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar minDate={new Date('2023-12-01')} maxDate={new Date('2023-12-10')} />);

    await setFieldValue(page.getByLabel('calendar'), new Date('2023-12-05'), { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Tue Dec 05 2023');
  });
});

test.describe('Inline PrimeReact calendar', () => {
  test('select date in current month', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar inline />);

    const date = new Date();
    date.setDate(3);

    await setFieldValue(page.locator('[data-pc-name="calendar"]'), date, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date.toDateString());
  });

  test('select date 2 months ago', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar inline />);

    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    date.setDate(3);

    await setFieldValue(page.locator('[data-pc-name="calendar"]'), date, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date.toDateString());
  });

  test('select date 2 months in the future', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar inline />);

    const date = new Date();
    date.setMonth(date.getMonth() + 2);
    date.setDate(3);

    await setFieldValue(page.locator('[data-pc-name="calendar"]'), date, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date.toDateString());
  });

  test('select specific date in the past', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar inline />);

    await setFieldValue(page.locator('[data-pc-name="calendar"]'), new Date('2024-07-15'), { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Mon Jul 15 2024');
  });

  test('in a different language (Dutch)', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar inline locale="nl" />);

    await page.evaluate(() => {
      document.documentElement.lang = 'nl';
    });

    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    date.setDate(3);

    await setFieldValue(page.locator('[data-pc-name="calendar"]'), date, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date.toDateString());
  });
});
