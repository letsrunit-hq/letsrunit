import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  standalone: true,
  imports: [FormsModule, DatePickerModule],
  template: `
    <label for="datepicker">datepicker</label>
    <p-datepicker inputId="datepicker" [(ngModel)]="value"></p-datepicker>
    <div aria-label="result">{{ value ? value.toDateString() : 'no date' }}</div>
  `,
})
export class PrimeNgDatePickerFixture {
  value: Date | null = null;
}

@Component({
  standalone: true,
  imports: [FormsModule, DatePickerModule],
  template: `
    <p-datepicker [inline]="true" [(ngModel)]="value"></p-datepicker>
    <div aria-label="result">{{ value ? value.toDateString() : 'no date' }}</div>
  `,
})
export class PrimeNgDatePickerInlineFixture {
  value: Date | null = null;
}
