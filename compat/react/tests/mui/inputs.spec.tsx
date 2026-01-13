import { setFieldValue } from '@letsrunit/playwright';
import { TextField } from '@mui/material';
import { expect, test } from '@playwright/experimental-ct-react';
import { MuiSwitch } from '../../src/mui/switch';

// Components that are controlled by native inputs

test.describe('MUI TextField', () => {
  test('set value', async ({ mount, page }) => {
    await mount(<TextField label="text" />);

    await setFieldValue(page.getByLabel('text'), 'hello', { timeout: 500 });
    await expect(page.locator('input')).toHaveValue('hello');
  });

  test('clear', async ({ mount, page }) => {
    await mount(<TextField label="text" defaultValue="abc" />);

    await expect(page.locator('input')).toHaveValue('abc');

    await setFieldValue(page.getByLabel('text'), null, { timeout: 500 });
    await expect(page.locator('input')).toHaveValue('');
  });

  test('multiline', async ({ mount, page }) => {
    await mount(<TextField label="text" multiline />);

    await setFieldValue(page.getByLabel('text'), 'hello\nworld', { timeout: 500 });
    await expect(page.locator('textarea').filter({ visible: true })).toHaveValue('hello\nworld');
  });
});

test('MUI Switch', async ({ mount, page }) => {
  await mount(<MuiSwitch />);

  await setFieldValue(page.getByLabel('switch'), true, { timeout: 500 });
  await expect(page.locator('input[type=checkbox]')).toBeChecked();
  await expect(page.getByLabel('result')).toContainText('on');

  await setFieldValue(page.getByLabel('switch'), false, { timeout: 500 });
  await expect(page.locator('input[type=checkbox]')).not.toBeChecked();
  await expect(page.getByLabel('result')).toContainText('off');
});
