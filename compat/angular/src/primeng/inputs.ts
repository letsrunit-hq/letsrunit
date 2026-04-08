import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  standalone: true,
  imports: [FormsModule, InputTextModule],
  template: `
    <label for="text">text</label>
    <input pInputText id="text" [(ngModel)]="value" />
  `,
})
export class PrimeNgInputTextFixture {
  value = '';
}

@Component({
  standalone: true,
  imports: [FormsModule, TextareaModule],
  template: `
    <label for="textarea">textarea</label>
    <textarea pTextarea id="textarea" [(ngModel)]="value"></textarea>
  `,
})
export class PrimeNgInputTextareaFixture {
  value = '';
}

@Component({
  standalone: true,
  imports: [FormsModule, CheckboxModule],
  template: `
    <label for="cb">checkbox</label>
    <p-checkbox inputId="cb" [binary]="true" [(ngModel)]="checked"></p-checkbox>
  `,
})
export class PrimeNgCheckboxFixture {
  checked = false;
}

@Component({
  standalone: true,
  imports: [FormsModule, ToggleSwitchModule],
  template: `
    <label for="toggleswitch">switch</label>
    <p-toggleswitch inputId="toggleswitch" [(ngModel)]="checked"></p-toggleswitch>
    <div aria-label="result">{{ checked ? 'on' : 'off' }}</div>
  `,
})
export class PrimeNgToggleSwitchFixture {
  checked = false;
}

@Component({
  standalone: true,
  imports: [FormsModule, RadioButtonModule],
  template: `
    <p-radiobutton inputId="female" value="female" [(ngModel)]="selected"></p-radiobutton>
    <label for="female">Female</label>
    <p-radiobutton inputId="male" value="male" [(ngModel)]="selected"></p-radiobutton>
    <label for="male">Male</label>
    <p-radiobutton inputId="other" value="other" [(ngModel)]="selected"></p-radiobutton>
    <label for="other">Other</label>
    <div aria-label="result">{{ selected }}</div>
  `,
})
export class PrimeNgRadioGroupFixture {
  selected = '';
}
