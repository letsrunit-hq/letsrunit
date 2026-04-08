import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div aria-label="otp-group">
      <input aria-label="otp-1" type="text" maxlength="1" [(ngModel)]="digits[0]" />
      <input aria-label="otp-2" type="text" maxlength="1" [(ngModel)]="digits[1]" />
      <input aria-label="otp-3" type="text" maxlength="1" [(ngModel)]="digits[2]" />
      <input aria-label="otp-4" type="text" maxlength="1" [(ngModel)]="digits[3]" />
      <input aria-label="otp-5" type="text" maxlength="1" [(ngModel)]="digits[4]" />
      <input aria-label="otp-6" type="text" maxlength="1" [(ngModel)]="digits[5]" />
    </div>
    <div aria-label="otp-result">{{ digits.join('') }}</div>
  `,
})
export class OtpFixture {
  digits = ['', '', '', '', '', ''];
}

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <div aria-label="date-group">
      <input aria-label="day" type="text" placeholder="DD" [(ngModel)]="day" />
      <input aria-label="month" type="text" placeholder="MM" [(ngModel)]="month" />
      <input aria-label="year" type="text" placeholder="YYYY" [(ngModel)]="year" />
    </div>
    <div aria-label="date-group-result">{{ day }}/{{ month }}/{{ year }}</div>
  `,
})
export class DateGroupFixture {
  day = '';
  month = '';
  year = '';
}

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <div aria-label="date-range-group">
      <input aria-label="from-date" type="text" [(ngModel)]="fromDate" />
      <input aria-label="to-date" type="text" [(ngModel)]="toDate" />
    </div>
    <div aria-label="date-range-result">{{ fromDate }} -> {{ toDate }}</div>
  `,
})
export class DateRangeGroupFixture {
  fromDate = '';
  toDate = '';
}
