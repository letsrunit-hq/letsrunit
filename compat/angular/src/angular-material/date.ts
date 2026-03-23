import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, FormsModule],
  template: `
    <mat-form-field>
      <mat-label>Date</mat-label>
      <input matInput [matDatepicker]="picker" aria-label="datepicker" [(ngModel)]="value" />
      <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
    </mat-form-field>
    <div aria-label="result">{{ value ? value.toDateString() : 'no date' }}</div>
  `,
})
export class MatDatepickerFixture {
  value: Date | null = null;
}
