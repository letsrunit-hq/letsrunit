import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import { TaigaCalendarFixture, TaigaDatepickerFixture, TaigaDateRangeFixture } from '../../src/taiga-ui/date';

test.describe('Taiga Datepicker', () => {
  test('select date with defaults', async ({ mount, page }) => {
    await mount(TaigaDatepickerFixture);

    await setFieldValue(page.getByLabel('datepicker'), new Date('2024-07-15'), { timeout: 5000 });
    await expect(page.getByLabel('datepicker')).toHaveValue('15.07.2024');
  });

  test('select date in the past', async ({ mount, page }) => {
    await mount(TaigaDatepickerFixture);

    await setFieldValue(page.getByLabel('datepicker'), new Date('2023-12-05'), { timeout: 5000 });
    await expect(page.getByLabel('datepicker')).toHaveValue('05.12.2023');
  });
});

test.describe('Taiga Calendar', () => {
  test('select date with defaults', async ({ mount, page }) => {
    await mount(TaigaCalendarFixture);

    await setFieldValue(page.locator('tui-calendar'), new Date('2024-07-15'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('2024-07-15');
  });

  test('select date in the past', async ({ mount, page }) => {
    await mount(TaigaCalendarFixture);

    await setFieldValue(page.locator('tui-calendar'), new Date('2023-12-05'), { timeout: 5000 });
    await expect(page.getByLabel('result')).toContainText('2023-12-05');
  });
});

test.describe('Taiga Date Range', () => {
  test('set range via generic date-group semantics', async ({ mount, page }) => {
    await mount(TaigaDateRangeFixture);

    await setFieldValue(
      page.getByLabel('date-range-group'),
      { from: new Date('2024-02-10'), to: new Date('2024-02-20') },
      { timeout: 5000 },
    );

    await expect(page.getByLabel('start')).toHaveValue('10.02.2024');
    await expect(page.getByLabel('end')).toHaveValue('20.02.2024');
  });
});
