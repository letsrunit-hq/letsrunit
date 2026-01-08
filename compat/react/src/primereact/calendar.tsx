import { addLocale, PrimeReactProvider } from 'primereact/api';
import { Calendar, CalendarProps } from 'primereact/calendar';
import { useState } from 'react';

export function PrimeReactCalendar(props: CalendarProps) {
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
      <Calendar ariaLabel="calendar" value={date} onChange={(e) => setDate(e.value)} {...props} />
    </PrimeReactProvider>
  );
}
