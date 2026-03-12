import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';
import { RadixCheckbox } from '../../src/radix/checkbox';
import { RadixRadioGroup } from '../../src/radix/radio-group';
import { RadixSelect } from '../../src/radix/select';
import { RadixSlider } from '../../src/radix/slider';
import { RadixSwitch } from '../../src/radix/switch';

test.describe('Radix Checkbox', () => {
  test('check', async ({ mount, page }) => {
    await mount(<RadixCheckbox />);
    await setFieldValue(page.getByLabel('checkbox'), true, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('on');
  });

  test('uncheck', async ({ mount, page }) => {
    await mount(<RadixCheckbox />);
    await setFieldValue(page.getByLabel('checkbox'), true, { timeout: 500 });
    await setFieldValue(page.getByLabel('checkbox'), false, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('off');
  });
});

test.describe('Radix Switch', () => {
  test('turn on', async ({ mount, page }) => {
    await mount(<RadixSwitch />);
    await setFieldValue(page.getByLabel('switch'), true, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('on');
  });

  test('turn off', async ({ mount, page }) => {
    await mount(<RadixSwitch />);
    await setFieldValue(page.getByLabel('switch'), true, { timeout: 500 });
    await setFieldValue(page.getByLabel('switch'), false, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('off');
  });
});

test.describe('Radix RadioGroup', () => {
  test('select option', async ({ mount, page }) => {
    await mount(<RadixRadioGroup />);
    await setFieldValue(page.getByLabel('color', { exact: true }), 'green', { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('green');
  });

  test('change selection', async ({ mount, page }) => {
    await mount(<RadixRadioGroup />);
    await setFieldValue(page.getByLabel('color', { exact: true }), 'green', { timeout: 500 });
    await setFieldValue(page.getByLabel('color', { exact: true }), 'blue', { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('blue');
  });
});

test.describe('Radix Select', () => {
  test('pick a value', async ({ mount, page }) => {
    await mount(<RadixSelect />);
    await setFieldValue(page.getByLabel('fruit'), 'banana', { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('banana');
  });

  test('change value', async ({ mount, page }) => {
    await mount(<RadixSelect />);
    await setFieldValue(page.getByLabel('fruit'), 'banana', { timeout: 500 });
    await setFieldValue(page.getByLabel('fruit'), 'cherry', { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('cherry');
  });
});

test.describe('Radix Slider', () => {
  test('set value', async ({ mount, page }) => {
    await mount(<RadixSlider />);
    await setFieldValue(page.getByLabel('volume'), 30, { timeout: 500 });
    await expect(page.getByLabel('result')).toContainText('30');
  });
});
