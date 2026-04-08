import { beforeMount } from '@sand4rt/experimental-ct-angular/hooks';

beforeMount<{ noopAnimations?: boolean }>(async ({ hooksConfig, TestBed }) => {
  if (!hooksConfig?.noopAnimations) {
    return;
  }

  await import('@angular/compiler');
  const animations = await import('@angular/platform-browser/animations');
  TestBed.configureTestingModule({
    providers: [...animations.provideNoopAnimations()],
  });
});
