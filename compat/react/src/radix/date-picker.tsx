import * as Popover from '@radix-ui/react-popover';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

export function RadixDatePicker() {
  const [date, setDate] = useState<Date | undefined>();
  return (
    <div>
      <Popover.Root>
        <Popover.Trigger aria-label="date">
          {date ? date.toDateString() : 'Pick a date'}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content>
            <DayPicker mode="single" selected={date} onSelect={setDate} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <div aria-label="result">{date?.toDateString() ?? ''}</div>
    </div>
  );
}
