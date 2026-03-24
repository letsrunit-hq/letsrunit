import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

function asDate(value: Date | null | undefined): string {
  if (!value) return '';
  return value.toISOString().slice(0, 10);
}

@Component({
  standalone: true,
  imports: [FormsModule, NzDatePickerModule],
  template: `
    <nz-date-picker aria-label="datepicker" [(ngModel)]="value"></nz-date-picker>
    <div aria-label="result">{{ result }}</div>
  `,
})
export class NzDatepickerFixture {
  value: Date | null = null;

  get result(): string {
    return asDate(this.value);
  }
}

@Component({
  standalone: true,
  imports: [FormsModule, NzDatePickerModule],
  template: `
    <div aria-label="date-range-group">
      <nz-date-picker [(ngModel)]="start"></nz-date-picker>
      <nz-date-picker [(ngModel)]="end"></nz-date-picker>
    </div>
    <div aria-label="result">{{ result }}</div>
  `,
})
export class NzDateRangePickerFixture {
  start: Date | null = null;
  end: Date | null = null;

  get result(): string {
    if (!this.start || !this.end) return '';
    return `${asDate(this.start)} - ${asDate(this.end)}`;
  }
}
