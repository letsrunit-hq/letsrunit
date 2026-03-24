import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzSliderModule } from 'ng-zorro-antd/slider';

@Component({
  standalone: true,
  imports: [FormsModule, NzSliderModule],
  template: `
    <nz-slider [nzMin]="0" [nzMax]="100" [(ngModel)]="value"></nz-slider>
    <div aria-label="result">{{ value }}</div>
  `,
})
export class NzSliderFixture {
  value = 20;
}
