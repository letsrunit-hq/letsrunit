export function statusSymbol(status: string | undefined = undefined) {
  switch (status) {
    case 'success': return '✔';
    case 'failure': return '✖';
    case 'skipped': return '-';
    default: return '○';
  }
}
