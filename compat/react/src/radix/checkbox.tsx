import * as Checkbox from '@radix-ui/react-checkbox';
import { useState } from 'react';

export function RadixCheckbox() {
  const [checked, setChecked] = useState(false);
  return (
    <div>
      <Checkbox.Root aria-label="checkbox" checked={checked} onCheckedChange={(v) => setChecked(v === true)}>
        <Checkbox.Indicator />
      </Checkbox.Root>
      <div aria-label="result">{checked ? 'on' : 'off'}</div>
    </div>
  );
}
