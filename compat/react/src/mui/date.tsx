import { DateCalendar, DateField, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { PickerValue } from '@mui/x-date-pickers/internals';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useState } from 'react';

export function MuiDatePicker(props: any) {
  const [value, setValue] = useState<PickerValue | null>(null);
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker label="datepicker" value={value} onChange={(newValue) => setValue(newValue)} {...props} />
      <div aria-label="result">{value ? (value as any).toDate().toDateString() : 'no date'}</div>
    </LocalizationProvider>
  );
}

export function MuiDateCalendar(props: any) {
  const [value, setValue] = useState<PickerValue | null>(null);
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar value={value} onChange={(newValue) => setValue(newValue)} {...props} />
      <div aria-label="result">{value ? (value as any).toDate().toDateString() : 'no date'}</div>
    </LocalizationProvider>
  );
}

export function MuiDateField(props: any) {
  const [value, setValue] = useState<PickerValue | null>(null);
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateField label="datefield" value={value} onChange={(newValue) => setValue(newValue)} {...props} />
      <div aria-label="result">{value ? (value as any).toDate().toDateString() : 'no date'}</div>
    </LocalizationProvider>
  );
}
