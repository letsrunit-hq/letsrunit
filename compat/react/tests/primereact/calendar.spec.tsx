import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';
import { PrimeReactCalendar, PrimeReactCalendarMultiple, PrimeReactCalendarRange } from '../../src/primereact/calendar';

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

  test('with multiple values', async ({ mount, page }) => {
    await mount(<PrimeReactCalendarMultiple />);

    const dates = [new Date('2024-07-15'), new Date('2024-07-18')];

    await setFieldValue(page.getByLabel('calendar'), dates, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Mon Jul 15 2024');
    await expect(page.getByLabel('result')).toContainText('Thu Jul 18 2024');
  });

  test('with multiple values and custom format', async ({ mount, page }) => {
    await mount(<PrimeReactCalendarMultiple dateFormat="d/m/y" />);

    const dates = [new Date('2024-03-02'), new Date('2024-03-04')];

    await setFieldValue(page.getByLabel('calendar'), dates, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Sat Mar 02 2024');
    await expect(page.getByLabel('result')).toContainText('Mon Mar 04 2024');
  });

  test('with range', async ({ mount, page }) => {
    await mount(<PrimeReactCalendarRange />);

    const dates = { from: new Date('2024-07-15'), to: new Date('2024-07-18') };

    await setFieldValue(page.getByLabel('calendar'), dates, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('From: Mon Jul 15 2024');
    await expect(page.getByLabel('result')).toContainText('To: Thu Jul 18 2024');
  });

  test('with range and custom format', async ({ mount, page }) => {
    await mount(<PrimeReactCalendarRange dateFormat="d/m/y" />);

    const dates = { from: new Date('2024-03-02'), to: new Date('2024-03-04') };

    await setFieldValue(page.getByLabel('calendar'), dates, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('From: Sat Mar 02 2024');
    await expect(page.getByLabel('result')).toContainText('To: Mon Mar 04 2024');
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

  test('with week numbers', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar inline showWeek />);

    const date = new Date();
    date.setDate(3);

    await setFieldValue(page.locator('[data-pc-name="calendar"]'), date, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date.toDateString());
  });

  test('with multiple values in the past', async ({ mount, page }) => {
    await mount(<PrimeReactCalendarMultiple inline />);

    const dates = [new Date('2024-07-15'), new Date('2024-07-18')];

    await setFieldValue(page.locator('[data-pc-name="calendar"]'), dates, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('Mon Jul 15 2024');
    await expect(page.getByLabel('result')).toContainText('Thu Jul 18 2024');
  });

  test('with multiple values in the future', async ({ mount, page }) => {
    await mount(<PrimeReactCalendarMultiple inline />);

    const date1 = new Date();
    date1.setDate(10);

    const date2 = new Date();
    date2.setMonth(date2.getMonth() + 2);
    date2.setDate(20);

    const dates = [date1, date2];

    await setFieldValue(page.locator('[data-pc-name="calendar"]'), dates, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date1.toDateString());
    await expect(page.getByLabel('result')).toContainText(date2.toDateString());
  });

  test('with range', async ({ mount, page }) => {
    await mount(<PrimeReactCalendarRange inline />);

    const dates = { from: new Date('2024-07-15'), to: new Date('2024-07-18') };

    await setFieldValue(page.locator('[data-pc-name="calendar"]'), dates, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('From: Mon Jul 15 2024');
    await expect(page.getByLabel('result')).toContainText('To: Thu Jul 18 2024');
  });

  test('with big range', async ({ mount, page }) => {
    await mount(<PrimeReactCalendarRange inline />);

    const dates = { from: new Date('2024-07-15'), to: new Date('2024-09-18') };

    await setFieldValue(page.locator('[data-pc-name="calendar"]'), dates, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('From: Mon Jul 15 2024');
    await expect(page.getByLabel('result')).toContainText('To: Wed Sep 18 2024');
  });
});

test.describe('Inline multi-month PrimeReact calendar', () => {
  test('with range', async ({ mount, page }) => {
    await mount(<PrimeReactCalendarRange numberOfMonths={3} inline />);

    const dateFrom = new Date();

    const dateTo = new Date();
    dateTo.setMonth(dateTo.getMonth() + 1);
    dateTo.setDate(18);

    const dates = { from: dateFrom, to: dateTo };

    await setFieldValue(page.locator('[data-pc-name="calendar"]'), dates, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(`From: ${dateFrom.toDateString()}`);
    await expect(page.getByLabel('result')).toContainText(`To: ${dateTo.toDateString()}`);
  });

  test('with multiple values in the future', async ({ mount, page }) => {
    await mount(<PrimeReactCalendarMultiple numberOfMonths={2} inline />);

    const date1 = new Date();
    date1.setDate(10);

    const date2 = new Date();
    date2.setMonth(date2.getMonth() + 2);
    date2.setDate(20);

    const dates = [date1, date2];

    await setFieldValue(page.locator('[data-pc-name="calendar"]'), dates, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date1.toDateString());
    await expect(page.getByLabel('result')).toContainText(date2.toDateString());
  });
});

test.describe('PrimeReact calendar with readonly input', () => {
  test('open and close dialog', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar readOnlyInput />);

    await expect(page.getByRole('dialog')).not.toBeAttached();

    await page.getByLabel('calendar').focus({ timeout: 500 });
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.getByLabel('calendar').blur();
    await expect(page.getByRole('dialog')).not.toBeAttached();
  });

  test('select date in current month', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar readOnlyInput />);

    const date = new Date();
    date.setDate(3);

    await setFieldValue(page.getByLabel('calendar'), date, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date.toDateString());

    await expect(page.getByRole('dialog')).not.toBeAttached();
  });

  test('select date 2 months ago', async ({ mount, page }) => {
    await mount(<PrimeReactCalendar readOnlyInput />);

    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    date.setDate(3);

    await setFieldValue(page.getByLabel('calendar'), date, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText(date.toDateString());
  });
});
