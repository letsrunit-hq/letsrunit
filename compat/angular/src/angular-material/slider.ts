import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  standalone: true,
  imports: [MatSliderModule, FormsModule],
  template: `
    <mat-slider min="0" max="100" aria-label="slider">
      <input matSliderThumb [(ngModel)]="value" />
    </mat-slider>
    <div aria-label="result">{{ value }}</div>
  `,
})
export class MatSliderFixture {
  value = 20;
}
