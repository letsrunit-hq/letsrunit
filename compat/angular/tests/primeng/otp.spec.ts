import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import { PrimeNgInputOtp6Fixture, PrimeNgInputOtpFixture } from '../../src/primeng/otp';
test.describe('PrimeNG InputOtp', () => {
  test('fill out', async ({ mount, page }) => {
    await mount(PrimeNgInputOtpFixture);

    await setFieldValue(page.locator('p-inputotp'), 'ab12', { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('ab12');
  });

  test('ignore spaces', async ({ mount, page }) => {
    await mount(PrimeNgInputOtp6Fixture);

    await setFieldValue(page.locator('p-inputotp'), 'a b c - 1 2 3', { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('abc123');
  });
});
