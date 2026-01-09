import { addLocale, PrimeReactProvider } from 'primereact/api';
import { Calendar, CalendarProps } from 'primereact/calendar';
import { useState } from 'react';

export function PrimeReactCalendar(props: CalendarProps<'single'>) {
  const [date, setDate] = useState<Date | null>();

  addLocale('nl', {
    firstDayOfWeek: 1,
    dayNames: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
    dayNamesShort: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
    dayNamesMin: ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'],
    monthNames: [
      'januari',
      'februari',
      'maart',
      'april',
      'mei',
      'juni',
      'juli',
      'augustus',
      'september',
      'oktober',
      'november',
      'december',
    ],
    monthNamesShort: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
    today: 'Vandaag',
    clear: 'Wissen',
  });

  return (
    <PrimeReactProvider>
      <div aria-label="result">{date?.toDateString()}</div>
      <Calendar
        ariaLabel="calendar"
        value={date}
        onChange={(e) => setDate(e.value)}
        {...props}
      />
    </PrimeReactProvider>
  );
}

export function PrimeReactCalendarMultiple(props: CalendarProps<'multiple'>) {
  const [dates, setDates] = useState<Date[]>([]);

  return (
    <PrimeReactProvider>
      <ul aria-label="result">
        {dates.map((date) => <li>{date?.toDateString()}</li>)}
      </ul>
      <Calendar
        selectionMode="multiple"
        ariaLabel="calendar"
        value={dates}
        onChange={(e) => setDates(e.value ?? [])}
        {...props}
      />
    </PrimeReactProvider>
  );
}

export function PrimeReactCalendarRange(props: CalendarProps<'range'>) {
  const [dates, setDates] = useState<{ from: Date | null, to: Date | null } | null>(null);

  return (
    <PrimeReactProvider>
      <div aria-label="result">
        {dates?.from && <div>From: {dates.from.toDateString()}</div>}
        {dates?.to && <div>To: {dates.to.toDateString()}</div>}
      </div>
      <Calendar
        selectionMode="range"
        ariaLabel="calendar"
        value={dates ? [dates.from, dates.to] : null}
        onChange={(e) => {
          setDates(e.value ? { from: e.value[0], to: e.value[1] } : null);
        }}
        {...props}
      />
    </PrimeReactProvider>
  );
}
