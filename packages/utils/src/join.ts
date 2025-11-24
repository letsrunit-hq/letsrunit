export function join(glue: string, ...items: Array<string | undefined | Array<string | undefined>>) {
  return items.flat().filter(Boolean).join(glue);
}

export function cn(...names: Array<string | undefined | Array<string | undefined>>) {
  return join(' ', ...names);
}
