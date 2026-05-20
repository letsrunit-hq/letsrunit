const LANGUAGE_PATTERNS = [
  /<html[^>]*\slang\s*=\s*["']([^"']+)["']/i,
  /<meta[^>]*http-equiv\s*=\s*["']content-language["'][^>]*content\s*=\s*["']([^"']+)["']/i,
  /<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*http-equiv\s*=\s*["']content-language["']/i,
  /<meta[^>]*name\s*=\s*["']language["'][^>]*content\s*=\s*["']([^"']+)["']/i,
  /<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["']language["']/i,
  /<meta[^>]*property\s*=\s*["']og:locale["'][^>]*content\s*=\s*["']([^"']+)["']/i,
  /<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:locale["']/i,
] as const;

export function extractLangFromHtml(html: string): string | null {
  for (const pattern of LANGUAGE_PATTERNS) {
    const value = pattern.exec(html)?.[1]?.trim();
    if (value) return value;
  }

  return null;
}
