import { setFieldValue } from '@letsrunit/playwright';
import { expect, test } from '@playwright/experimental-ct-react';
import { createFallbackLocator } from '../../../../packages/playwright/src/fallback-locator';
import { PrimeReactInputText } from '../../src/primereact/inputs';

test('PrimeReact InputText via fallback locator', async ({ mount, page }) => {
  await mount(<PrimeReactInputText />);

  const locator = createFallbackLocator([page.locator('#missing-field'), page.getByLabel('Text')]);
  await setFieldValue(locator, 'hello', { timeout: 1000 });

  await expect(page.getByLabel('Text')).toHaveValue('hello');
});
