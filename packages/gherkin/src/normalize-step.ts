export function normalizeStep(
  keyword: string,
  text: string,
  docString?: { content: string },
  dataTable?: { rows: ReadonlyArray<{ cells: ReadonlyArray<{ value: string }> }> },
): string {
  let result = `${keyword.trim()} ${text.trim()}`;

  if (docString?.content) {
    result += `\n"""\n${docString.content.trim()}\n"""`;
  }

  if (dataTable?.rows?.length) {
    const table = dataTable.rows
      .map((r) => `| ${r.cells.map((c) => c.value.trim()).join(' | ')} |`)
      .join('\n');
    result += `\n${table}`;
  }

  return result;
}
