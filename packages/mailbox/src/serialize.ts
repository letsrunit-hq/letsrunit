import type { Email } from './types';

export function toEml(email: Email): string {
  const lines: string[] = [];
  const crlf = (s: string) => s.replace(/\n/g, '\r\n');

  const date = new Date(email.timestamp);
  // Use RFC 2822 format via toUTCString
  lines.push(`Date: ${date.toUTCString()}`);
  lines.push(`From: ${email.from}`);
  lines.push(`To: ${email.to}`);
  if (email.cc) lines.push(`Cc: ${email.cc}`);
  lines.push(`Subject: ${email.subject}`);
  lines.push('MIME-Version: 1.0');

  const hasText = typeof email.text === 'string' && email.text.length > 0;
  const hasHtml = typeof email.html === 'string' && email.html.length > 0;
  const hasAttachments = Array.isArray(email.attachments) && email.attachments.length > 0;

  const boundary = `===============lr_${Math.random().toString(36).slice(2)}_${Date.now()}==`;
  const altBoundary = `===============lr_alt_${Math.random().toString(36).slice(2)}_${Date.now()}==`;

  function pushTextPart() {
    lines.push(`Content-Type: text/plain; charset=utf-8`);
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(crlf(hasText ? email.text! : ''));
  }

  function pushHtmlPart() {
    lines.push(`Content-Type: text/html; charset=utf-8`);
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(crlf(hasHtml ? email.html! : ''));
  }

  // Build structure
  if (hasAttachments) {
    // multipart/mixed enclosing either single/alternative plus attachments
    lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    lines.push('');
    lines.push(`--${boundary}`);
    if (hasText && hasHtml) {
      // nested multipart/alternative
      lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
      lines.push('');
      // text part
      lines.push(`--${altBoundary}`);
      pushTextPart();
      // html part
      lines.push(`--${altBoundary}`);
      pushHtmlPart();
      // end alternative
      lines.push(`--${altBoundary}--`);
    } else if (hasText) {
      pushTextPart();
    } else {
      pushHtmlPart();
    }

    // attachments (metadata only; empty bodies)
    for (const a of email.attachments || []) {
      lines.push(`--${boundary}`);
      const disp = `attachment; filename="${a.filename}"`;
      lines.push(`Content-Type: ${a.contentType}; name="${a.filename}"`);
      lines.push(`Content-Disposition: ${disp}`);
      lines.push('Content-Transfer-Encoding: base64');
      lines.push('');
      // No content stored in type, emit empty body to keep structure valid
      lines.push('');
    }
    lines.push(`--${boundary}--`);
  } else if (hasText && hasHtml) {
    // multipart/alternative
    lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
    lines.push('');
    lines.push(`--${altBoundary}`);
    pushTextPart();
    lines.push(`--${altBoundary}`);
    pushHtmlPart();
    lines.push(`--${altBoundary}--`);
  } else if (hasText) {
    pushTextPart();
  } else {
    pushHtmlPart();
  }

  // Ensure CRLF endings
  return lines.join('\r\n');
}

export function fromEml(contents: string): Email {
  // Normalize line endings to \n for parsing
  const raw = contents.replace(/\r\n/g, '\n');
  const [rawHeader, ...rest] = raw.split(/\n\n/);
  const headerLines = rawHeader.split('\n');
  // Handle folded headers (lines starting with space or tab)
  const unfolded: string[] = [];
  for (const line of headerLines) {
    if (/^[ \t]/.test(line) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.replace(/^\s+/, ' ');
    } else {
      unfolded.push(line);
    }
  }
  const headers = new Map<string, string>();
  for (const l of unfolded) {
    const idx = l.indexOf(':');
    if (idx === -1) continue;
    const key = l.slice(0, idx).trim().toLowerCase();
    const val = l.slice(idx + 1).trim();
    headers.set(key, val);
  }
  const body = rest.join('\n\n');

  const email: Email = {
    timestamp: Date.parse(headers.get('date') || new Date().toUTCString()),
    from: headers.get('from') || '',
    to: headers.get('to') || '',
    cc: headers.get('cc') || undefined,
    subject: headers.get('subject') || '',
  } as Email;

  // Parse body depending on content-type
  const ct = (headers.get('content-type') || '').toLowerCase();

  function parseParts(contentType: string, data: string): { text?: string; html?: string; attachments?: { filename: string; contentType: string }[] } {
    const result: { text?: string; html?: string; attachments?: { filename: string; contentType: string }[] } = { attachments: [] };
    if (contentType.startsWith('multipart/')) {
      const m = contentType.match(/boundary="?([^";]+)"?/);
      const boundary = m ? m[1] : '';
      if (!boundary) return result;
      // Line-oriented multipart parsing
      const lines = data.split('\n');
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        if (line === `--${boundary}`) {
          // Parse headers
          i++;
          const pHeaders = new Map<string, string>();
          const headAccum: string[] = [];
          for (; i < lines.length; i++) {
            const l = lines[i];
            if (l === '') break;
            headAccum.push(l);
          }
          // skip empty line
          if (i < lines.length && lines[i] === '') i++;
          // unfold and map headers
          const unfolded: string[] = [];
          for (const h of headAccum) {
            if ((h.startsWith(' ') || h.startsWith('\t')) && unfolded.length) {
              unfolded[unfolded.length - 1] += h.replace(/^\s+/, ' ');
            } else {
              unfolded.push(h);
            }
          }
          for (const h of unfolded) {
            const idx = h.indexOf(':');
            if (idx !== -1) pHeaders.set(h.slice(0, idx).trim().toLowerCase(), h.slice(idx + 1).trim());
          }
          // Collect body until next boundary marker
          const bodyLines: string[] = [];
          for (; i < lines.length; i++) {
            const l = lines[i];
            if (l === `--${boundary}` || l === `--${boundary}--`) break;
            bodyLines.push(l);
          }
          const pBody = bodyLines.join('\n');

          const pct = (pHeaders.get('content-type') || '').toLowerCase();
          const disp = (pHeaders.get('content-disposition') || '').toLowerCase();
          if (pct.startsWith('multipart/')) {
            const nested = parseParts(pct, pBody);
            if (nested.text && !result.text) result.text = nested.text;
            if (nested.html && !result.html) result.html = nested.html;
            if (nested.attachments && nested.attachments.length) result.attachments!.push(...nested.attachments);
          } else if (pct.startsWith('text/plain')) {
            result.text = pBody;
          } else if (pct.startsWith('text/html')) {
            result.html = pBody;
          } else if (disp.startsWith('attachment') || disp.includes('filename=')) {
            let filename = '';
            const fnm = disp.match(/filename="?([^";]+)"?/);
            if (fnm) filename = fnm[1];
            if (!filename) {
              const nm = pct.match(/name="?([^";]+)"?/);
              if (nm) filename = nm[1];
            }
            const contentTypeHeader = pHeaders.get('content-type') || 'application/octet-stream';
            result.attachments!.push({ filename, contentType: contentTypeHeader.split(';')[0] });
          }

          // If current line is closing boundary, advance past it and stop
          if (i < lines.length && lines[i] === `--${boundary}--`) {
            break;
          }
          // continue to next line (which is next boundary or end)
        } else if (line === `--${boundary}--`) {
          break;
        } else {
          i++;
        }
      }
      // Fallback pass: ensure we didn't miss any attachment headers
      const segs = (`\n${data}`).split(`\n--${boundary}`);
      const have = new Set(result.attachments!.map((a) => `${a.filename}|${a.contentType}`));
      for (let seg of segs) {
        seg = seg.replace(/^\n/, '');
        if (!seg || seg.startsWith('--')) continue;
        const [head] = seg.split(/\n\n/);
        const disp = (head.match(/(^|\n)content-disposition:\s*([^\n]+)/i)?.[2] || '').toLowerCase();
        if (!disp.includes('attachment')) continue;
        let filename = '';
        const fnm = disp.match(/filename="?([^";]+)"?/);
        if (fnm) filename = fnm[1];
        const ct = (head.match(/(^|\n)content-type:\s*([^\n]+)/i)?.[2] || 'application/octet-stream').split(';')[0];
        const key = `${filename}|${ct}`;
        if (!have.has(key)) {
          have.add(key);
          result.attachments!.push({ filename, contentType: ct });
        }
      }
      // Order attachments by first appearance in the original data
      if (result.attachments && result.attachments.length > 1) {
        const positions = new Map<string, number>();
        for (const a of result.attachments) {
          const key = `${a.filename}|${a.contentType}`;
          if (!positions.has(key)) {
            const re = new RegExp(`filename=\"?${a.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\"?`, 'i');
            const idx = data.search(re);
            positions.set(key, idx === -1 ? Number.MAX_SAFE_INTEGER : idx);
          }
        }
        result.attachments.sort((a, b) => {
          const ka = `${a.filename}|${a.contentType}`;
          const kb = `${b.filename}|${b.contentType}`;
          return (positions.get(ka) ?? 0) - (positions.get(kb) ?? 0);
        });
      }
      return result;
    }
    // single part
    if (contentType.startsWith('text/plain')) {
      result.text = data;
    } else if (contentType.startsWith('text/html')) {
      result.html = data;
    }
    return result;
  }

  const parsed = parseParts(ct, body);
  if (parsed.text !== undefined) email.text = parsed.text;
  if (parsed.html !== undefined) email.html = parsed.html;
  if (parsed.attachments && parsed.attachments.length) email.attachments = parsed.attachments;

  return email;
}
