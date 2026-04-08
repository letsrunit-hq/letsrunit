import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import { DateGroupFixture, DateRangeGroupFixture, OtpFixture } from '../../src/angular-material/composite';

test.describe('Composite Field Components', () => {
  test('OTP group', async ({ mount, page }) => {
    await mount(OtpFixture);

    await setFieldValue(page.getByLabel('otp-group'), '123456', { timeout: 1000 });
    await expect(page.getByLabel('otp-result')).toContainText('123456');
  });

  test('date group (day/month/year)', async ({ mount, page }) => {
    await mount(DateGroupFixture);

    await setFieldValue(page.getByLabel('date-group', { exact: true }), new Date('2024-07-15'), { timeout: 1000 });
    await expect(page.getByLabel('date-group-result')).toContainText('15');
    await expect(page.getByLabel('date-group-result')).toContainText('2024');
  });

  test('date range group (text inputs)', async ({ mount, page }) => {
    await mount(DateRangeGroupFixture);

    await setFieldValue(
      page.getByLabel('date-range-group'),
      { from: new Date('2024-02-10'), to: new Date('2024-02-20') },
      { timeout: 1000 },
    );
    await expect(page.getByLabel('date-range-result')).toContainText('2024');
  });
});
