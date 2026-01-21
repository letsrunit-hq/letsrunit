export default function supabaseLoader({ src, width, quality }) {
  if (src.startsWith('http://127.0.0.1:54321') || src.match(/^https:\/\/\w+.supabase.co\//)) {
    return `${src}?width=${width}&quality=${quality || 75}`;
  }

  return `/_next/image?url=${src}&w=${width}&q=${quality || 75}`;
}
