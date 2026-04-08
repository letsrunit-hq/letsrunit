import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputOtpModule } from 'primeng/inputotp';

@Component({
  standalone: true,
  imports: [FormsModule, InputOtpModule],
  template: `
    <p-inputotp [length]="4" [(ngModel)]="value"></p-inputotp>
    <div aria-label="result">{{ value }}</div>
  `,
})
export class PrimeNgInputOtpFixture {
  value = '';
}

@Component({
  standalone: true,
  imports: [FormsModule, InputOtpModule],
  template: `
    <p-inputotp [length]="6" [(ngModel)]="value"></p-inputotp>
    <div aria-label="result">{{ value }}</div>
  `,
})
export class PrimeNgInputOtp6Fixture {
  value = '';
}
