import { runner } from './runner';
import { browse } from './playwright/browser';

export async function run(feature: string) {
  const { page } = await runner.run(feature, async () => {
    const page = await browse();
    return { page };
  });

  return {
    url: page.url(),
    content: await page.content(),
  };
}

export function listSteps() {

}
