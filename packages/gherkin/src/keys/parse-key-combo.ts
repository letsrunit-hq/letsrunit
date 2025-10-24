export type Modifier = 'Control' | 'Shift' | 'Alt' | 'Meta';
export type Key =
  | Modifier
  | 'Enter' | 'Escape' | 'Tab' | 'Backspace' | 'Delete'
  | 'Space' | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
  | 'PageUp' | 'PageDown' | 'Home' | 'End'
  | `F${1|2|3|4|5|6|7|8|9|10|11|12}`;

export type KeyCombo = {
  /** Modifiers pressed and held before the final key. */
  modifiers: Modifier[];
  /** The final key to press (e.g. 'Enter', 'S', 'ArrowUp', 'F5', etc.). */
  key: Key | string; // string allows plain characters like "A", "s", ";" etc.
};

// Normalization map (case-insensitive keys)
const SYNONYMS: Record<string, Key | Modifier> = {
  // modifiers
  'ctrl': 'Control', 'control': 'Control',
  'cmd': 'Meta', 'command': 'Meta', 'meta': 'Meta',
  'opt': 'Alt', 'option': 'Alt', 'alt': 'Alt',
  'shift': 'Shift',

  // common keys
  'enter': 'Enter', 'return': 'Enter',
  'esc': 'Escape', 'escape': 'Escape',
  'tab': 'Tab',
  'backspace': 'Backspace',
  'del': 'Delete', 'delete': 'Delete',
  'space': 'Space',
  'home': 'Home', 'end': 'End',
  'pageup': 'PageUp', 'page up': 'PageUp',
  'pagedown': 'PageDown', 'page down': 'PageDown',

  // arrows
  'arrowup': 'ArrowUp', 'arrow up': 'ArrowUp', 'up': 'ArrowUp',
  'arrowdown': 'ArrowDown', 'arrow down': 'ArrowDown', 'down': 'ArrowDown',
  'arrowleft': 'ArrowLeft', 'arrow left': 'ArrowLeft', 'left': 'ArrowLeft',
  'arrowright': 'ArrowRight', 'arrow right': 'ArrowRight', 'right': 'ArrowRight',
};

function normalizeToken(raw: string): Key | string {
  const t = raw.trim().toLowerCase();

  // F-keys: f1..f12
  const fMatch = /^f([1-9]|1[0-2])$/.exec(t);
  if (fMatch) return `F${fMatch[1]}` as Key;

  // Letter/char keys like "A", "s", ";", "0"
  // Keep as-is but upper-case single letters to look nicer in logs.
  if (!(t in SYNONYMS)) {
    if (t.length === 1) return raw.trim().length === 1 ? raw.trim().toUpperCase() : raw.trim();
    return raw.trim();
  }

  return SYNONYMS[t];
}

const isModifier = (k: Key | string): k is Modifier =>
  k === 'Control' || k === 'Shift' || k === 'Alt' || k === 'Meta';

export function parseKeyCombo(text: string): KeyCombo {
  // Allow things like: Ctrl+S, Ctrl + S, "Ctrl + Alt + Delete"
  const parts = text.split('+').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) throw new Error(`Invalid key combo: "${text}"`);

  const tokens = parts.map(normalizeToken);

  const modifiers: Modifier[] = [];
  let key: Key | string | undefined;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const isLast = i === tokens.length - 1;

    if (!isLast && isModifier(tok)) {
      modifiers.push(tok);
    } else if (isLast) {
      // The final token is the "key" (can be modifier or normal key)
      key = tok;
    } else {
      // Non-last, non-modifier token encountered (e.g., "Ctrl + ArrowUp + Enter" is fine,
      // but if a non-modifier appears before the last, we still allow it only if the last is present).
      // We treat everything before the last as modifiers-only; if tok isn't a modifier, error out:
      if (!isModifier(tok)) {
        throw new Error(`Only modifiers may precede the final key: "${text}"`);
      }
      modifiers.push(tok);
    }
  }

  if (!key) throw new Error(`Missing final key in combo: "${text}"`);
  return { modifiers, key };
}
