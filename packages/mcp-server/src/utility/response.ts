export function text(content: string) {
  return { content: [{ type: 'text' as const, text: content }] };
}

export function err(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}
