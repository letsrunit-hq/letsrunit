import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <mat-form-field>
      <mat-label>text</mat-label>
      <input matInput [(ngModel)]="value" />
    </mat-form-field>
  `,
})
export class MatInputFixture {
  value = '';
}

@Component({
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <mat-form-field>
      <mat-label>text</mat-label>
      <textarea matInput [(ngModel)]="value"></textarea>
    </mat-form-field>
  `,
})
export class MatInputMultilineFixture {
  value = '';
}

@Component({
  standalone: true,
  imports: [MatSlideToggleModule, FormsModule],
  template: `
    <mat-slide-toggle [(ngModel)]="checked">Toggle</mat-slide-toggle>
    <div aria-label="result">{{ checked ? 'on' : 'off' }}</div>
  `,
})
export class MatSlideToggleFixture {
  checked = false;
}

@Component({
  standalone: true,
  imports: [MatCheckboxModule, FormsModule],
  template: `
    <mat-checkbox aria-label="checkbox" [(ngModel)]="checked">Checkbox</mat-checkbox>
  `,
})
export class MatCheckboxFixture {
  checked = false;
}

@Component({
  standalone: true,
  imports: [MatRadioModule, FormsModule],
  template: `
    <mat-radio-group aria-label="gender" [(ngModel)]="selected">
      <mat-radio-button value="female">Female</mat-radio-button>
      <mat-radio-button value="male">Male</mat-radio-button>
      <mat-radio-button value="other">Other</mat-radio-button>
    </mat-radio-group>
  `,
})
export class MatRadioGroupFixture {
  selected = 'female';
}

@Component({
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, FormsModule],
  template: `
    <mat-form-field>
      <mat-label>age</mat-label>
      <mat-select [(ngModel)]="selected">
        <mat-option value="10">Ten</mat-option>
        <mat-option value="20">Twenty</mat-option>
        <mat-option value="30">Thirty</mat-option>
      </mat-select>
    </mat-form-field>
    <div aria-label="result">{{ selected }}</div>
  `,
})
export class MatSelectFixture {
  selected = '20';
}
