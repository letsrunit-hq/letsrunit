import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiCheckbox } from '@taiga-ui/core/components/checkbox';
import { TuiRadioComponent } from '@taiga-ui/core/components/radio';
import { TuiTextfield } from '@taiga-ui/core/components/textfield';
import { TuiNativeSelect } from '@taiga-ui/kit/components/select';
import { TuiSwitch } from '@taiga-ui/kit/components/switch';
import { TuiTextarea } from '@taiga-ui/kit/components/textarea';

@Component({
  standalone: true,
  imports: [FormsModule, TuiTextfield],
  template: `
    <tui-textfield>
      <input tuiTextfield aria-label="text" [(ngModel)]="value" />
    </tui-textfield>
  `,
})
export class TaigaInputFixture {
  value = '';
}

@Component({
  standalone: true,
  imports: [FormsModule, TuiTextfield, TuiTextarea],
  template: `
    <tui-textfield>
      <textarea tuiTextarea aria-label="text" [(ngModel)]="value"></textarea>
    </tui-textfield>
  `,
})
export class TaigaTextareaFixture {
  value = '';
}

@Component({
  standalone: true,
  imports: [FormsModule, TuiCheckbox],
  template: `
    <label for="checkbox">checkbox</label>
    <input id="checkbox" type="checkbox" tuiCheckbox [(ngModel)]="checked" />
  `,
})
export class TaigaCheckboxFixture {
  checked = false;
}

@Component({
  standalone: true,
  imports: [FormsModule, TuiSwitch],
  template: `
    <label for="switch">switch</label>
    <input id="switch" type="checkbox" tuiSwitch [(ngModel)]="checked" />
    <div aria-label="result">{{ checked ? 'on' : 'off' }}</div>
  `,
})
export class TaigaSwitchFixture {
  checked = false;
}

@Component({
  standalone: true,
  imports: [FormsModule, TuiRadioComponent],
  template: `
    <input id="female" type="radio" name="gender" value="female" tuiRadio [(ngModel)]="selected" />
    <label for="female">Female</label>

    <input id="male" type="radio" name="gender" value="male" tuiRadio [(ngModel)]="selected" />
    <label for="male">Male</label>

    <input id="other" type="radio" name="gender" value="other" tuiRadio [(ngModel)]="selected" />
    <label for="other">Other</label>
  `,
})
export class TaigaRadioGroupFixture {
  selected = 'female';
}

@Component({
  standalone: true,
  imports: [FormsModule, TuiTextfield, TuiNativeSelect],
  template: `
    <label for="age">age</label>
    <tui-textfield>
      <select id="age" tuiSelect aria-label="age" [items]="ages" [(ngModel)]="selected"></select>
    </tui-textfield>

    <div aria-label="result">{{ selected }}</div>
  `,
})
export class TaigaSelectFixture {
  ages = ['10', '20', '30'];
  selected = '20';
}
