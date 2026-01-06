import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';
import { NativeForm } from '../src/native-form';

test.describe('Native HTML compatibility', () => {
  test('sets text input', async ({ mount, page }) => {
    await mount(<NativeForm />);

    await setFieldValue(page.getByLabel('Text'), 'hello', { timeout: 500 });
    await expect(page.getByLabel('Text')).toHaveValue('hello');
  });

  test('checks checkbox', async ({ mount, page }) => {
    await mount(<NativeForm />);

    await setFieldValue(page.getByLabel('Agree'), true, { timeout: 500 });
    await expect(page.getByLabel('Agree')).toBeChecked();
  });

  test('selects option by value', async ({ mount, page }) => {
    await mount(<NativeForm />);

    await setFieldValue(page.getByLabel('Country'), 'NL', { timeout: 500 });
    await expect(page.getByLabel('Country')).toHaveValue('NL');
  });

  test('selects option by description', async ({ mount, page }) => {
    await mount(<NativeForm />);

    await setFieldValue(page.getByLabel('Country'), 'Netherlands', { timeout: 500 });
    await expect(page.getByLabel('Country')).toHaveValue('NL');
  });

  test('sets date', async ({ mount, page }) => {
    await mount(<NativeForm />);

    await setFieldValue(page.getByLabel('Date'), new Date('2024-01-15'), { timeout: 500 });
    await expect(page.getByLabel('Date')).toHaveValue('2024-01-15');
  });
});
