import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';
import { PrimeReactOtp } from '../../src/primereact/otp';

test.describe('PrimeReact OTP', () => {
  test('fill out', async ({ mount, page }) => {
    await mount(<PrimeReactOtp />);

    await setFieldValue(page.locator('.p-inputotp'), 'ab12', { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('ab12');
  });

  test('ignore spaces', async ({ mount, page }) => {
    await mount(<PrimeReactOtp length={6} />);

    await setFieldValue(page.locator('.p-inputotp'), 'a b c - 1 2 3', { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('abc123');
  });
});
