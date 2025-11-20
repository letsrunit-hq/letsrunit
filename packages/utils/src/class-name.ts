export function cn(...names: Array<string | undefined | Array<string | undefined>>) {
  return names.flat().filter(Boolean).join(' ');
}
