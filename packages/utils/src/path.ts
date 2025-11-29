export function splitUrl(url: string): { base: string; path: string } {
  const parsed = new URL(url);
  const base = `${parsed.protocol}//${parsed.host}`;
  const path = parsed.pathname + parsed.search + parsed.hash;
  return { base, path };
}

export function asFilename(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')   // collapse to dashes
    .replace(/^-+|-+$/g, '');      // trim dashes
}

export function pathRegexp(path: string): { regexp: RegExp, names: string[] } {
  // Build a regex from the pattern and extract params
  const names: string[] = [];

  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = path
    .split('/')
    .map((seg) => {
      if (seg.startsWith(':')) {
        names.push(seg.slice(1));
        return '([^/]+)';
      }
      return escape(seg);
    })
    .join('/');

  const regexp = new RegExp(`^${pattern}$`);

  return { regexp, names };
}
