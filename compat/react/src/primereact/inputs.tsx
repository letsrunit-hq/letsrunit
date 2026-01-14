import { PrimeReactProvider } from 'primereact/api';
import { Checkbox } from 'primereact/checkbox';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { RadioButton } from 'primereact/radiobutton';
import { useState } from 'react';

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';

export function PrimeReactInputText(props: any) {
  return (
    <PrimeReactProvider>
      <label htmlFor="text">Text</label>
      <InputText id="text" {...props} />
    </PrimeReactProvider>
  );
}

export function PrimeReactInputTextarea(props: any) {
  return (
    <PrimeReactProvider>
      <label htmlFor="textarea">Textarea</label>
      <InputTextarea id="textarea" {...props} />
    </PrimeReactProvider>
  );
}

export function PrimeReactCheckbox() {
  const [checked, setChecked] = useState(false);
  return (
    <PrimeReactProvider>
      <label htmlFor="cb">Accept</label>
      <Checkbox inputId="cb" checked={checked} onChange={(e) => setChecked(e.checked ?? false)} />
    </PrimeReactProvider>
  );
}

export function PrimeReactInputSwitch() {
  const [checked, setChecked] = useState(false);
  return (
    <PrimeReactProvider>
      <label htmlFor="sw">Switch</label>
      <InputSwitch inputId="sw" checked={checked} onChange={(e) => setChecked(e.value ?? false)} />
    </PrimeReactProvider>
  );
}

export function PrimeReactRadioButton() {
  const [ingredient, setIngredient] = useState('');
  return (
    <PrimeReactProvider>
      <div className="flex align-items-center">
        <RadioButton
          inputId="ingredient1"
          name="pizza"
          value="Cheese"
          onChange={(e) => setIngredient(e.value)}
          checked={ingredient === 'Cheese'}
        />
        <label htmlFor="ingredient1" className="ml-2">
          Cheese
        </label>
      </div>
      <div className="flex align-items-center">
        <RadioButton
          inputId="ingredient2"
          name="pizza"
          value="Mushroom"
          onChange={(e) => setIngredient(e.value)}
          checked={ingredient === 'Mushroom'}
        />
        <label htmlFor="ingredient2" className="ml-2">
          Mushroom
        </label>
      </div>
    </PrimeReactProvider>
  );
}
