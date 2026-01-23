import React from 'react';

export type LocalDateTimeProps = {
  className?: string;
  date: Date;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
};

export function LocalDateTime({ className, date, locale = 'en-UK', options }: LocalDateTimeProps) {
  const [text, setText] = React.useState<string>('');

  React.useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const fmt = new Intl.DateTimeFormat(locale, {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
      ...options,
    });

    setText(fmt.format(date));
  }, [date, locale, options]);

  return (
    <time className={className} dateTime={date.toISOString()} suppressHydrationWarning>
      {text}
    </time>
  );
}

export default LocalDateTime;
