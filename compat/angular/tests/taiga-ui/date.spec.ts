import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import { TaigaDatepickerFixture, TaigaDateRangeFixture } from '../../src/taiga-ui/date';

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

test.describe('Taiga Datepicker TODOs (hard-failing by design)', () => {
  test('TODO: support generic range-object semantics for Taiga date group wrappers', async ({ mount, page }) => {
    await mount(TaigaDateRangeFixture);

    await setFieldValue(
      page.getByLabel('date-range-group'),
      { from: new Date('2024-02-10'), to: new Date('2024-02-20') },
      { timeout: 5000 },
    );

    // Aspirational assertion: currently unsupported path should be made to pass later.
    await expect(page.getByLabel('start')).toHaveValue('2024-02-10');
    await expect(page.getByLabel('end')).toHaveValue('2024-02-20');
  });
});
