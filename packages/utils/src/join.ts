export function join(glue: string, ...items: Array<string | undefined | false | Array<string | undefined | false>>) {
  return items.flat().filter(Boolean).join(glue);
}

export function cn(...names: Array<string | undefined | false | Array<string | undefined | false>>) {
  return join(' ', ...names);
}
