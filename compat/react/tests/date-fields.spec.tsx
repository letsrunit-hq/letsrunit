import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';

test.describe('Date fields', () => {
  test('set native date', async ({ mount, page }) => {
    await mount(<input type="date" />);

    await setFieldValue(page.locator('input'), new Date('2024-07-15'), { timeout: 500 });
    await expect(page.locator('input')).toHaveValue('2024-07-15');
  });

  test('set native datetime-local', async ({ mount, page }) => {
    await mount(<input type="datetime-local" />);

    await setFieldValue(page.locator('input'), new Date('2024-07-15T22:03'), { timeout: 500 });
    await expect(page.locator('input')).toHaveValue('2024-07-15T22:03');
  });

  test('set native month', async ({ mount, page }) => {
    await mount(<input type="month" />);

    await setFieldValue(page.locator('input'), new Date('2024-07-15'), { timeout: 500 });
    await expect(page.locator('input')).toHaveValue('2024-07');
  });

  test('set native week', async ({ mount, page }) => {
    await mount(<input type="week" />);

    await setFieldValue(page.locator('input'), new Date('2024-07-15'), { timeout: 500 });
    await expect(page.locator('input')).toHaveValue('2024-W29');
  });

  test('set native time', async ({ mount, page }) => {
    await mount(<input type="time" />);

    await setFieldValue(page.locator('input'), new Date('2024-07-15T22:03'), { timeout: 500 });
    await expect(page.locator('input')).toHaveValue('22:03');
  });

  test('set date range', async ({ mount, page }) => {
    await mount(
      <div role="group">
        <input type="date" name="date_from" />
        <input type="date" name="date_to" />
      </div>,
    );

    const range = { from: new Date('2024-07-15'), to: new Date('2024-07-18') };

    await setFieldValue(page.getByRole('group'), range, { timeout: 500 });
    await expect(page.locator('input[name="date_from"]')).toHaveValue('2024-07-15');
    await expect(page.locator('input[name="date_to"]')).toHaveValue('2024-07-18');
  });

  test.describe('set grouped date', () => {
    test('with select month', async ({ mount, page }) => {
      await mount(
        <form>
          <label id="birthday-label">Birthday</label>
          <div aria-labelledby="birthday-label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="number" name="birthday_day" />
            <select name="birthday_month">
              <option value="jan">Januari</option>
              <option value="feb">Februari</option>
              <option value="mar">March</option>
              <option value="apr">April</option>
              <option value="may">May</option>
              <option value="jun">June</option>
              <option value="jul">July</option>
              <option value="aug">August</option>
              <option value="sep">September</option>
              <option value="oct">October</option>
              <option value="nov">November</option>
              <option value="dec">December</option>
            </select>
            <input type="number" name="birthday_year" />
          </div>
        </form>,
      );

      await setFieldValue(page.getByLabel('Birthday'), new Date('2024-07-15'), { timeout: 500 });
      await expect(page.locator('input[name="birthday_day"]')).toHaveValue('15');
      await expect(page.locator('select[name="birthday_month"]')).toHaveValue('jul');
      await expect(page.locator('input[name="birthday_year"]')).toHaveValue('2024');
    });

    test('with month number', async ({ mount, page }) => {
      await mount(
        <form>
          <label id="birthday-label">Birthday</label>
          <div aria-labelledby="birthday-label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="number" name="a" placeholder="DD" />
            <input type="number" name="b" placeholder="MM" />
            <input type="number" name="c" placeholder="YYYY" />
          </div>
        </form>,
      );

      await setFieldValue(page.getByLabel('Birthday'), new Date('2024-07-15'), { timeout: 500 });
      await expect(page.locator('input[name="a"]')).toHaveValue('15');
      await expect(page.locator('input[name="b"]')).toHaveValue('7');
      await expect(page.locator('input[name="c"]')).toHaveValue('2024');
    });
  });
});
