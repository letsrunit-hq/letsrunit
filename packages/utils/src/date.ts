export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function parseDateString(str: string): Date {
  const dateRegex =
    /^((?:today|tomorrow|yesterday|(\d+) (\w+) (?:ago|from now))(?: (?:at )?(\d\d?:\d\d(?::\d\d)?))?|"(.*)")$/;
  const match = str.match(dateRegex);

  if (!match) {
    throw new Error(`Invalid date string: ${str}`);
  }

  const quoted = match[5];
  if (quoted !== undefined) {
    const date = new Date(quoted.replace(/\\"/g, '"'));
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date string: ${str}`);
    }
    return date;
  }

  const date = new Date();

  const relative = match[1];
  if (relative.startsWith('tomorrow')) {
    date.setDate(date.getDate() + 1);
  } else if (relative.startsWith('yesterday')) {
    date.setDate(date.getDate() - 1);
  } else if (match[2] && match[3]) {
    const amount = parseInt(match[2], 10);
    const unit = match[3].toLowerCase();
    const multiplier = relative.endsWith('ago') ? -1 : 1;

    switch (unit) {
      case 'year':
      case 'years':
        date.setFullYear(date.getFullYear() + amount * multiplier);
        break;
      case 'month':
      case 'months':
        date.setMonth(date.getMonth() + amount * multiplier);
        break;
      case 'week':
      case 'weeks':
        date.setDate(date.getDate() + amount * 7 * multiplier);
        break;
      case 'day':
      case 'days':
        date.setDate(date.getDate() + amount * multiplier);
        break;
      case 'hour':
      case 'hours':
        date.setHours(date.getHours() + amount * multiplier);
        break;
      case 'minute':
      case 'minutes':
        date.setMinutes(date.getMinutes() + amount * multiplier);
        break;
      case 'second':
      case 'seconds':
        date.setSeconds(date.getSeconds() + amount * multiplier);
        break;
      default:
        throw new Error(`Invalid date string: ${str}`);
    }
  }

  const time = match[4];
  if (time) {
    const [hours, minutes, seconds] = time.split(':').map((s) => parseInt(s, 10));
    date.setHours(hours, minutes, seconds ?? 0, 0);
  }

  return date;
}
