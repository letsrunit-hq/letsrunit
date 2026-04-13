import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import {
  TaigaCheckboxFixture,
  TaigaInputFixture,
  TaigaRadioGroupFixture,
  TaigaSelectFixture,
  TaigaSwitchFixture,
  TaigaTextareaFixture,
} from '../../src/taiga-ui/inputs';

test.describe('Taiga Input', () => {
  test('set value', async ({ mount, page }) => {
    await mount(TaigaInputFixture);

    await setFieldValue(page.getByLabel('text'), 'hello', { timeout: 1000 });
    await expect(page.getByLabel('text')).toHaveValue('hello');
  });

  test('clear', async ({ mount, page }) => {
    await mount(TaigaInputFixture);

    await setFieldValue(page.getByLabel('text'), 'abc', { timeout: 1000 });
    await expect(page.getByLabel('text')).toHaveValue('abc');

    await setFieldValue(page.getByLabel('text'), null, { timeout: 1000 });
    await expect(page.getByLabel('text')).toHaveValue('');
  });

  test('multiline', async ({ mount, page }) => {
    await mount(TaigaTextareaFixture);

    await setFieldValue(page.getByLabel('text'), 'hello\nworld', { timeout: 1000 });
    await expect(page.getByLabel('text')).toHaveValue('hello\nworld');
  });
});

test('Taiga Switch', async ({ mount, page }) => {
  await mount(TaigaSwitchFixture);

  await setFieldValue(page.getByLabel('switch', { exact: true }), true, { timeout: 1000 });
  await expect(page.getByLabel('result')).toContainText('on');

  await setFieldValue(page.getByLabel('switch', { exact: true }), false, { timeout: 1000 });
  await expect(page.getByLabel('result')).toContainText('off');
});

test('Taiga Checkbox', async ({ mount, page }) => {
  await mount(TaigaCheckboxFixture);

  await setFieldValue(page.getByLabel('checkbox', { exact: true }), true, { timeout: 1000 });
  await expect(page.locator('input[type=checkbox]')).toBeChecked();

  await setFieldValue(page.getByLabel('checkbox', { exact: true }), false, { timeout: 1000 });
  await expect(page.locator('input[type=checkbox]')).not.toBeChecked();
});

test('Taiga Radio Group', async ({ mount, page }) => {
  await mount(TaigaRadioGroupFixture);

  await setFieldValue(page.getByLabel('Male', { exact: true }), true, { timeout: 1000 });
  await expect(page.getByLabel('Male', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Female', { exact: true })).not.toBeChecked();

  await setFieldValue(page.getByLabel('Other', { exact: true }), true, { timeout: 1000 });
  await expect(page.getByLabel('Other', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Male', { exact: true })).not.toBeChecked();
});

test('Taiga Select', async ({ mount, page }) => {
  await mount(TaigaSelectFixture);

  await setFieldValue(page.getByLabel('age'), '30', { timeout: 1000 });
  await expect(page.getByLabel('result')).toContainText('30');

  await setFieldValue(page.getByLabel('age'), '10', { timeout: 1000 });
  await expect(page.getByLabel('result')).toContainText('10');
});
