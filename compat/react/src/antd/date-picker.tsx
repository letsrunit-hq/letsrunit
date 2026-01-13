import { DatePicker, type DatePickerProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';

type RangePickerProps = Parameters<typeof DatePicker.RangePicker>[0]; // not exported by antd

export function AntdDatePicker(props: DatePickerProps) {
  const [date, setDate] = useState<Dayjs | null>(null);

  return (
    <>
      <div aria-label="result">{date?.toDate().toDateString()}</div>
      <DatePicker
        aria-label="datepicker"
        value={date}
        onChange={(value) => setDate(value as Dayjs | null)}
        {...props}
      />
    </>
  );
}

export function AntdRangePickerMultiple(props: DatePickerProps) {
  const [dates, setDates] = useState<Dayjs[] | null>(null);

  return (
    <>
      <ul aria-label="result">
        {(dates ?? []).map((date) => (
          <li>{date.toDate().toDateString()}</li>
        ))}
      </ul>

      <DatePicker
        aria-label="datepicker"
        multiple
        value={dates}
        onChange={(value) => setDates(value as Dayjs[] | null)}
        {...props}
      />
    </>
  );
}

export function AntdRangePicker(props: RangePickerProps) {
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  return (
    <>
      <div aria-label="result">
        {dates?.[0] && <div>From: {dates[0].toDate().toDateString()}</div>}
        {dates?.[1] && <div>To: {dates[1].toDate().toDateString()}</div>}
      </div>
      <div aria-label="rangepicker">
        <DatePicker.RangePicker value={dates} onChange={(values) => setDates(values)} {...props} />
      </div>
    </>
  );
}
