import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiSlider } from '@taiga-ui/core/components/slider';

@Component({
  standalone: true,
  imports: [FormsModule, TuiSlider],
  template: `
    <input type="range" tuiSlider min="0" max="100" step="1" [(ngModel)]="value" />
    <div aria-label="result">{{ value }}</div>
  `,
})
export class TaigaSliderFixture {
  value = 20;
}
