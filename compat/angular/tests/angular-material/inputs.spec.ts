import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import {
  MatCheckboxFixture,
  MatInputFixture,
  MatInputMultilineFixture,
  MatRadioGroupFixture,
  MatSelectFixture,
  MatSlideToggleFixture,
} from '../../src/angular-material/inputs';

test.describe('Mat Input', () => {
  test('set value', async ({ mount, page }) => {
    await mount(MatInputFixture);

    await setFieldValue(page.getByLabel('text'), 'hello', { timeout: 1000 });
    await expect(page.locator('input')).toHaveValue('hello');
  });

  test('clear', async ({ mount, page }) => {
    await mount(MatInputFixture);

    await setFieldValue(page.getByLabel('text'), 'abc', { timeout: 1000 });
    await expect(page.locator('input')).toHaveValue('abc');

    await setFieldValue(page.getByLabel('text'), null, { timeout: 1000 });
    await expect(page.locator('input')).toHaveValue('');
  });

  test('multiline', async ({ mount, page }) => {
    await mount(MatInputMultilineFixture);

    await setFieldValue(page.getByLabel('text'), 'hello\nworld', { timeout: 1000 });
    await expect(page.locator('textarea').filter({ visible: true })).toHaveValue('hello\nworld');
  });
});

test('Mat Slide Toggle', async ({ mount, page }) => {
  await mount(MatSlideToggleFixture);

  await setFieldValue(page.getByRole('switch'), true, { timeout: 1000 });
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByLabel('result')).toContainText('on');

  await setFieldValue(page.getByRole('switch'), false, { timeout: 1000 });
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByLabel('result')).toContainText('off');
});

test('Mat Checkbox', async ({ mount, page }) => {
  await mount(MatCheckboxFixture);

  await setFieldValue(page.getByLabel('checkbox'), true, { timeout: 500 });
  await expect(page.locator('input[type=checkbox]')).toBeChecked();

  await setFieldValue(page.getByLabel('checkbox'), false, { timeout: 500 });
  await expect(page.locator('input[type=checkbox]')).not.toBeChecked();
});

test('Mat Radio Group', async ({ mount, page }) => {
  await mount(MatRadioGroupFixture);

  await setFieldValue(page.getByLabel('Male', { exact: true }), true, { timeout: 1000 });
  await expect(page.getByLabel('Male', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Female', { exact: true })).not.toBeChecked();

  await setFieldValue(page.getByLabel('Other', { exact: true }), true, { timeout: 1000 });
  await expect(page.getByLabel('Other', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Male', { exact: true })).not.toBeChecked();
});

test('Mat Select', async ({ mount, page }) => {
  await mount(MatSelectFixture);

  await setFieldValue(page.getByRole('combobox', { name: /age/i }), '30', { timeout: 1000 });
  await expect(page.getByLabel('result')).toContainText('30');

  await setFieldValue(page.getByRole('combobox', { name: /age/i }), '10', { timeout: 1000 });
  await expect(page.getByLabel('result')).toContainText('10');
});
