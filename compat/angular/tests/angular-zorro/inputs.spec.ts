import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@sand4rt/experimental-ct-angular';
import { registerHtmlDump } from './debug-html';
import {
  NzCheckboxFixture,
  NzInputFixture,
  NzInputMultilineFixture,
  NzRadioGroupFixture,
  NzSelectFixture,
  NzSwitchFixture,
} from '../../src/angular-zorro/inputs';

registerHtmlDump(test);

test.describe('Nz Input', () => {
  test('set value', async ({ mount, page }) => {
    await mount(NzInputFixture);

    await setFieldValue(page.getByLabel('text'), 'hello', { timeout: 1000 });
    await expect(page.getByLabel('text')).toHaveValue('hello');
  });

  test('clear', async ({ mount, page }) => {
    await mount(NzInputFixture);

    await setFieldValue(page.getByLabel('text'), 'abc', { timeout: 1000 });
    await expect(page.getByLabel('text')).toHaveValue('abc');

    await setFieldValue(page.getByLabel('text'), null, { timeout: 1000 });
    await expect(page.getByLabel('text')).toHaveValue('');
  });

  test('multiline', async ({ mount, page }) => {
    await mount(NzInputMultilineFixture);

    await setFieldValue(page.getByLabel('text'), 'hello\nworld', { timeout: 1000 });
    await expect(page.getByLabel('text')).toHaveValue('hello\nworld');
  });
});

test('Nz Switch', async ({ mount, page }) => {
  await mount(NzSwitchFixture);

  await setFieldValue(page.getByLabel('switch'), true, { timeout: 1000 });
  await expect(page.locator('nz-switch button')).toHaveClass(/ant-switch-checked/);
  await expect(page.getByLabel('result')).toContainText('on');

  await setFieldValue(page.getByLabel('switch'), false, { timeout: 1000 });
  await expect(page.locator('nz-switch button')).not.toHaveClass(/ant-switch-checked/);
  await expect(page.getByLabel('result')).toContainText('off');
});

test('Nz Checkbox', async ({ mount, page }) => {
  await mount(NzCheckboxFixture);

  await setFieldValue(page.getByRole('checkbox', { name: 'Checkbox' }), true, { timeout: 1000 });
  await expect(page.getByRole('checkbox', { name: 'Checkbox' })).toBeChecked();

  await setFieldValue(page.getByRole('checkbox', { name: 'Checkbox' }), false, { timeout: 1000 });
  await expect(page.getByRole('checkbox', { name: 'Checkbox' })).not.toBeChecked();
});

test('Nz Radio Group', async ({ mount, page }) => {
  await mount(NzRadioGroupFixture);

  await setFieldValue(page.locator('nz-radio-group'), 'male', { timeout: 1000 });
  await expect(page.locator('label').filter({ hasText: /^Male$/ })).toHaveClass(/ant-radio-wrapper-checked/);
  await expect(page.locator('label').filter({ hasText: /^Female$/ })).not.toHaveClass(/ant-radio-wrapper-checked/);

  await setFieldValue(page.locator('nz-radio-group'), 'other', { timeout: 1000 });
  await expect(page.locator('label').filter({ hasText: /^Other$/ })).toHaveClass(/ant-radio-wrapper-checked/);
  await expect(page.locator('label').filter({ hasText: /^Male$/ })).not.toHaveClass(/ant-radio-wrapper-checked/);
});

test('Nz Select', async ({ mount, page }) => {
  await mount(NzSelectFixture, {
    hooksConfig: {
      noopAnimations: true,
    },
  });

  await setFieldValue(page.locator('nz-select'), '30', { timeout: 1000 });
  await expect(page.getByLabel('result')).toContainText('30');

  await setFieldValue(page.locator('nz-select'), '10', { timeout: 1000 });
  await expect(page.getByLabel('result')).toContainText('10');
});
