import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';

test.describe('Native form inputs', () => {
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

  test('checks radio button', async ({ mount, page }) => {
    await mount(
      <form>
        <label htmlFor="radio">Option</label>
        <input id="radio" type="radio" value="opt1" />
      </form>,
    );

    await setFieldValue(page.getByLabel('Option'), true, { timeout: 500 });
    await expect(page.getByLabel('Option')).toBeChecked();
  });

  test('selects radio from group', async ({ mount, page }) => {
    await mount(
      <fieldset aria-label="Group">
        <label>
          <input type="radio" name="group" value="A" /> A
        </label>
        <label>
          <input type="radio" name="group" value="B" /> B
        </label>
      </fieldset>,
    );

    await setFieldValue(page.getByLabel('Group'), 'B', { timeout: 500 });
    await expect(page.locator('input[value="B"]')).toBeChecked();
    await expect(page.locator('input[value="A"]')).not.toBeChecked();
  });

  test('sets range input', async ({ mount, page }) => {
    await mount(
      <form>
        <label htmlFor="range">Range</label>
        <input id="range" type="range" min="0" max="100" />
      </form>,
    );

    await setFieldValue(page.getByLabel('Range'), 50, { timeout: 500 });
    await expect(page.getByLabel('Range')).toHaveValue('50');

    await setFieldValue(page.getByLabel('Range'), '75', { timeout: 500 });
    await expect(page.getByLabel('Range')).toHaveValue('75');
  });
});
