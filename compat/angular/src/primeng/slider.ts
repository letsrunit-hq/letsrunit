import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SliderModule } from 'primeng/slider';

@Component({
  standalone: true,
  imports: [FormsModule, SliderModule],
  template: `
    <p-slider [min]="0" [max]="100" [(ngModel)]="value"></p-slider>
    <div aria-label="result">{{ value }}</div>
  `,
})
export class PrimeNgSliderFixture {
  value = 20;
}
