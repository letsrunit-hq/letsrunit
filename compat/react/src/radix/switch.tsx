import * as Switch from '@radix-ui/react-switch';
import { useState } from 'react';

export function RadixSwitch() {
  const [checked, setChecked] = useState(false);
  return (
    <div>
      <Switch.Root aria-label="switch" checked={checked} onCheckedChange={setChecked}>
        <Switch.Thumb />
      </Switch.Root>
      <div aria-label="result">{checked ? 'on' : 'off'}</div>
    </div>
  );
}
