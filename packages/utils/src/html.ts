export function textToHtml(text: string): string {
  // Basic HTML escaping to prevent injection
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  // Linkify http/https URLs
  const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
  const linkified = escaped.replace(urlRegex, (href) => {
    return `<a href="${href}" rel="noopener noreferrer">${href}</a>`;
  });

  // Wrap in a div with white-space: pre so text preserves whitespace/newlines
  return `<div style="white-space: pre">${linkified}</div>`;
}
