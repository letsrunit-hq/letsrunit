export function diffArray<T>(ref: T[], cmp: T[]) {
  const selectedSet = new Set(ref);
  return [...new Set(cmp)].filter((v) => !selectedSet.has(v));
}

export function uniqueItem<T>(m: T, i: T, self: T[]): boolean {
  return self.indexOf(m) === i;
}
