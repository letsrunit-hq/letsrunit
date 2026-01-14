import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';
import { Checkbox, Input, InputNumber } from 'antd';

// Components that are controlled by native inputs

test('AntDesign Checkbox', async ({ mount, page }) => {
  await mount(<Checkbox>Check</Checkbox>);

  const checkbox = page.getByLabel('Check');

  await setFieldValue(checkbox, true, { timeout: 500 });
  await expect(checkbox).toBeChecked();

  await setFieldValue(checkbox, false, { timeout: 500 });
  await expect(checkbox).not.toBeChecked();
});

test('AntDesign Input', async ({ mount, page }) => {
  await mount(<Input aria-label="Input" />);

  const input = page.getByLabel('Input');

  await setFieldValue(input, 'hello', { timeout: 500 });
  await expect(input).toHaveValue('hello');

  await setFieldValue(input, null, { timeout: 500 });
  await expect(input).toHaveValue('');
});

test('AntDesign Input.Search', async ({ mount, page }) => {
  let searchedValue = '';
  await mount(
    <Input.Search
      aria-label="Search"
      enterButton
      allowClear
      onSearch={(value) => {
        searchedValue = value;
      }}
    />,
  );

  const input = page.getByRole('searchbox', { name: 'Search' });

  await setFieldValue(input, 'query', { timeout: 500 });
  await expect(input).toHaveValue('query');

  // Test enterButton (trigger search)
  await input.press('Enter');
  expect(searchedValue).toBe('query');

  // Test allowClear
  const clearIcon = page.locator('.ant-input-clear-icon');
  await clearIcon.click();
  await expect(input).toHaveValue('');
});

test('AntDesign Input.Password', async ({ mount, page }) => {
  await mount(<Input.Password aria-label="Password" />);

  const input = page.getByLabel('Password');

  await setFieldValue(input, 'secret', { timeout: 500 });
  await expect(input).toHaveValue('secret');
  await expect(input).toHaveAttribute('type', 'password');
});

test('AntDesign Input.TextArea', async ({ mount, page }) => {
  await mount(<Input.TextArea aria-label="TextArea" />);

  const input = page.getByLabel('TextArea');

  await setFieldValue(input, 'line1\nline2', { timeout: 500 });
  await expect(input).toHaveValue('line1\nline2');
});

test('AntDesign InputNumber', async ({ mount, page }) => {
  await mount(<InputNumber aria-label="Number" />);

  const input = page.getByLabel('Number');

  await setFieldValue(input, 123, { timeout: 500 });
  await expect(input).toHaveValue('123');
});

test('AntDesign InputNumber with formatter', async ({ mount, page }) => {
  await mount(<InputNumber aria-label="Percent" defaultValue={100} min={0} max={100} suffix="%" />);

  const input = page.getByLabel('Percent');

  await setFieldValue(input, 50, { timeout: 500 });
  await expect(input).toHaveValue('50');
  await expect(page.getByText('%')).toBeVisible();
});
