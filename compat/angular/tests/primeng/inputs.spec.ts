import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import {
  PrimeNgCheckboxFixture,
  PrimeNgInputTextareaFixture,
  PrimeNgInputTextFixture,
  PrimeNgRadioGroupFixture,
  PrimeNgToggleSwitchFixture,
} from '../../src/primeng/inputs';
test.describe('PrimeNG InputText', () => {
  test('set value', async ({ mount, page }) => {
    await mount(PrimeNgInputTextFixture);

    await setFieldValue(page.getByLabel('text'), 'hello', { timeout: 1000 });
    await expect(page.locator('input')).toHaveValue('hello');
  });

  test('clear', async ({ mount, page }) => {
    await mount(PrimeNgInputTextFixture);

    await setFieldValue(page.getByLabel('text'), 'abc', { timeout: 1000 });
    await expect(page.locator('input')).toHaveValue('abc');

    await setFieldValue(page.getByLabel('text'), null, { timeout: 1000 });
    await expect(page.locator('input')).toHaveValue('');
  });
});

test('PrimeNG InputTextarea', async ({ mount, page }) => {
  await mount(PrimeNgInputTextareaFixture);

  await setFieldValue(page.getByLabel('textarea'), 'hello\nworld', { timeout: 1000 });
  await expect(page.locator('textarea')).toHaveValue('hello\nworld');
});

test('PrimeNG Checkbox', async ({ mount, page }) => {
  await mount(PrimeNgCheckboxFixture);

  await setFieldValue(page.getByLabel('checkbox', { exact: true }), true, { timeout: 1000 });
  await expect(page.locator('input[type=checkbox]')).toBeChecked();

  await setFieldValue(page.getByLabel('checkbox', { exact: true }), false, { timeout: 1000 });
  await expect(page.locator('input[type=checkbox]')).not.toBeChecked();
});

test('PrimeNG ToggleSwitch', async ({ mount, page }) => {
  await mount(PrimeNgToggleSwitchFixture);

  await setFieldValue(page.getByLabel('switch', { exact: true }), true, { timeout: 1000 });
  await expect(page.getByLabel('result')).toContainText('on');

  await setFieldValue(page.getByLabel('switch', { exact: true }), false, { timeout: 1000 });
  await expect(page.getByLabel('result')).toContainText('off');
});

test('PrimeNG RadioGroup', async ({ mount, page }) => {
  await mount(PrimeNgRadioGroupFixture);

  await setFieldValue(page.getByLabel('Male', { exact: true }), true, { timeout: 1000 });
  await expect(page.getByLabel('Male', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Female', { exact: true })).not.toBeChecked();

  await setFieldValue(page.getByLabel('Other', { exact: true }), true, { timeout: 1000 });
  await expect(page.getByLabel('Other', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Male', { exact: true })).not.toBeChecked();
});
