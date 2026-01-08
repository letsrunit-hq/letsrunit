import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';

test.describe('Native HTML compatibility', () => {
  test('sets text input', async ({ mount, page }) => {
    await mount(
      <form>
        <label htmlFor="text">Text</label>
        <input id="text" />
      </form>,
    );

    await setFieldValue(page.getByLabel('Text'), 'hello', { timeout: 500 });
    await expect(page.getByLabel('Text')).toHaveValue('hello');
  });

  test('sets textarea', async ({ mount, page }) => {
    await mount(
      <form>
        <label htmlFor="text">Text</label>
        <textarea id="text" />
      </form>,
    );

    await setFieldValue(page.getByLabel('Text'), 'hello', { timeout: 500 });
    await expect(page.getByLabel('Text')).toHaveValue('hello');
  });

  test('checks checkbox', async ({ mount, page }) => {
    await mount(
      <form>
        <label htmlFor="check">Agree</label>
        <input id="check" type="checkbox" />
      </form>,
    );

    await setFieldValue(page.getByLabel('Agree'), true, { timeout: 500 });
    await expect(page.getByLabel('Agree')).toBeChecked();
  });

  test('selects option by value', async ({ mount, page }) => {
    await mount(
      <form>
        <label htmlFor="select">Country</label>
        <select id="select">
          <option value="">--</option>
          <option value="NL">Netherlands</option>
          <option value="DE">Germany</option>
        </select>
      </form>,
    );

    // By value
    await setFieldValue(page.getByLabel('Country'), 'NL', { timeout: 500 });
    await expect(page.getByLabel('Country')).toHaveValue('NL');

    // By description
    await setFieldValue(page.getByLabel('Country'), 'Germany', { timeout: 500 });
    await expect(page.getByLabel('Country')).toHaveValue('DE');
  });

  test('sets date', async ({ mount, page }) => {
    await mount(
      <form>
        <label htmlFor="date">Date</label>
        <input id="date" type="date" />
      </form>,
    );

    await setFieldValue(page.getByLabel('Date'), new Date('2024-01-15'), { timeout: 500 });
    await expect(page.getByLabel('Date')).toHaveValue('2024-01-15');
  });
});
