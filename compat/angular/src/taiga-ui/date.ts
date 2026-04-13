import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiTextfield } from '@taiga-ui/core/components/textfield';
import { TuiInputDate } from '@taiga-ui/kit/components/input-date';

@Component({
  standalone: true,
  imports: [FormsModule, TuiTextfield, TuiInputDate],
  template: `
    <tui-textfield>
      <input tuiInputDate type="date" aria-label="datepicker" [(ngModel)]="value" />
    </tui-textfield>
    <div aria-label="result">{{ value ? value.toString() : 'no date' }}</div>
  `,
})
export class TaigaDatepickerFixture {
  value: unknown = null;
}

@Component({
  standalone: true,
  imports: [FormsModule, TuiTextfield, TuiInputDate],
  template: `
    <div aria-label="date-range-group">
      <tui-textfield>
        <input tuiInputDate type="date" aria-label="start" [(ngModel)]="start" />
      </tui-textfield>
      <tui-textfield>
        <input tuiInputDate type="date" aria-label="end" [(ngModel)]="end" />
      </tui-textfield>
    </div>
    <div aria-label="result">{{ result }}</div>
  `,
})
export class TaigaDateRangeFixture {
  start: unknown = null;
  end: unknown = null;

  get result(): string {
    return `${String(this.start)} - ${String(this.end)}`;
  }
}
