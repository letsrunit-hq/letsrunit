import { DatePicker, DatePickerProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';

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

export function AntdRangePicker(props: any) {
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  return (
    <>
      <div aria-label="result">
        {dates?.[0] && <div>From: {dates[0].toDate().toDateString()}</div>}
        {dates?.[1] && <div>To: {dates[1].toDate().toDateString()}</div>}
      </div>
      <div aria-label="rangepicker">
        <DatePicker.RangePicker
          value={dates}
          onChange={(values) => setDates(values)}
          {...props}
        />
      </div>
    </>
  );
}
