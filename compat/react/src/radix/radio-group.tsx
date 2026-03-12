import * as RadioGroup from '@radix-ui/react-radio-group';
import { useState } from 'react';

export function RadixRadioGroup() {
  const [value, setValue] = useState('');
  return (
    <div>
      <RadioGroup.Root aria-label="color" value={value} onValueChange={setValue}>
        <RadioGroup.Item value="red" aria-label="Red" />
        <RadioGroup.Item value="green" aria-label="Green" />
        <RadioGroup.Item value="blue" aria-label="Blue" />
      </RadioGroup.Root>
      <div aria-label="result">{value}</div>
    </div>
  );
}
