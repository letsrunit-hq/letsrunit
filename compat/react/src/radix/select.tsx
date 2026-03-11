import * as Select from '@radix-ui/react-select';
import { useState } from 'react';

export function RadixSelect() {
  const [value, setValue] = useState('');
  return (
    <div>
      <Select.Root value={value} onValueChange={setValue}>
        <Select.Trigger aria-label="fruit">
          <Select.Value placeholder="Pick a fruit" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content>
            <Select.Item value="apple">Apple</Select.Item>
            <Select.Item value="banana">Banana</Select.Item>
            <Select.Item value="cherry">Cherry</Select.Item>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <div aria-label="result">{value}</div>
    </div>
  );
}
