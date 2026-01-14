import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';
import {
  PrimeReactCheckbox,
  PrimeReactInputSwitch,
  PrimeReactInputText,
  PrimeReactInputTextarea,
  PrimeReactRadioButton,
} from '../../src/primereact/inputs';

test.describe('PrimeReact InputText', () => {
  test('set value', async ({ mount, page }) => {
    await mount(<PrimeReactInputText />);

    await setFieldValue(page.getByLabel('Text'), 'hello', { timeout: 1000 });
    await expect(page.getByLabel('Text')).toHaveValue('hello');
  });

  test('clear', async ({ mount, page }) => {
    await mount(<PrimeReactInputText defaultValue="abc" />);

    await expect(page.getByLabel('Text')).toHaveValue('abc');

    await setFieldValue(page.getByLabel('Text'), null, { timeout: 1000 });
    await expect(page.getByLabel('Text')).toHaveValue('');
  });
});

test('PrimeReact InputTextarea', async ({ mount, page }) => {
  await mount(<PrimeReactInputTextarea />);

  await setFieldValue(page.getByLabel('Textarea'), 'hello\nworld', { timeout: 1000 });
  await expect(page.getByLabel('Textarea')).toHaveValue('hello\nworld');
});

test('PrimeReact Checkbox', async ({ mount, page }) => {
  await mount(<PrimeReactCheckbox />);

  await setFieldValue(page.getByLabel('Accept'), true, { timeout: 1000 });
  await expect(page.locator('input[type=checkbox]')).toBeChecked();

  await setFieldValue(page.getByLabel('Accept'), false, { timeout: 1000 });
  await expect(page.locator('input[type=checkbox]')).not.toBeChecked();
});

test('PrimeReact InputSwitch', async ({ mount, page }) => {
  await mount(<PrimeReactInputSwitch />);

  await setFieldValue(page.getByLabel('Switch'), true, { timeout: 1000 });
  await expect(page.locator('input[type=checkbox]')).toBeChecked();

  await setFieldValue(page.getByLabel('Switch'), false, { timeout: 1000 });
  await expect(page.locator('input[type=checkbox]')).not.toBeChecked();
});

test('PrimeReact RadioButton', async ({ mount, page }) => {
  await mount(<PrimeReactRadioButton />);

  await setFieldValue(page.getByLabel('Cheese'), true, { timeout: 1000 });
  await expect(page.getByLabel('Cheese')).toBeChecked();

  await setFieldValue(page.getByLabel('Mushroom'), true, { timeout: 1000 });
  await expect(page.getByLabel('Mushroom')).toBeChecked();
  await expect(page.getByLabel('Cheese')).not.toBeChecked();
});
