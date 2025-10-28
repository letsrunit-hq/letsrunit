export function splitUrl(url: string): { base: string; path: string } {
  const parsed = new URL(url);
  const base = `${parsed.protocol}//${parsed.host}`;
  const path = parsed.pathname + parsed.search + parsed.hash;
  return { base, path };
}
