import { setFieldValue } from '@letsrunit/playwright';
import { Checkbox, FormControlLabel, Radio, RadioGroup, TextField } from '@mui/material';
import { expect, test } from '@playwright/experimental-ct-react';
import { MuiSlider } from '../../src/mui/slider';
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

test('MUI Checkbox', async ({ mount, page }) => {
  await mount(<Checkbox aria-label="checkbox" />);

  await setFieldValue(page.getByLabel('checkbox'), true, { timeout: 500 });
  await expect(page.locator('input[type=checkbox]')).toBeChecked();

  await setFieldValue(page.getByLabel('checkbox'), false, { timeout: 500 });
  await expect(page.locator('input[type=checkbox]')).not.toBeChecked();
});

test('MUI Radio Group', async ({ mount, page }) => {
  await mount(
    <RadioGroup aria-label="gender" defaultValue="female" name="radio-buttons-group">
      <FormControlLabel value="female" control={<Radio />} label="Female" />
      <FormControlLabel value="male" control={<Radio />} label="Male" />
      <FormControlLabel value="other" control={<Radio />} label="Other" />
    </RadioGroup>,
  );

  await setFieldValue(page.getByLabel('Male', { exact: true }), true, { timeout: 500 });
  await expect(page.getByLabel('Male', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Female', { exact: true })).not.toBeChecked();

  await setFieldValue(page.getByLabel('Other', { exact: true }), true, { timeout: 500 });
  await expect(page.getByLabel('Other', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Male', { exact: true })).not.toBeChecked();
});

test('MUI Slider', async ({ mount, page }) => {
  await mount(<MuiSlider />);

  await setFieldValue(page.getByLabel('slider'), 50, { timeout: 500 });
  await expect(page.getByLabel('result')).toContainText('50');

  await setFieldValue(page.getByLabel('slider'), 10, { timeout: 500 });
  await expect(page.getByLabel('result')).toContainText('10');
});
