import 'zone.js';
import { beforeMount } from '@sand4rt/experimental-ct-angular/hooks';
import { provideAnimations } from '@angular/platform-browser/animations';

beforeMount(async ({ TestBed }) => {
  await TestBed.configureTestingModule({
    providers: [provideAnimations()],
  }).compileComponents();
});
