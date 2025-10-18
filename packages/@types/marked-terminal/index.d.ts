declare module 'marked-terminal' {
  import type { HighlightOptions } from 'cli-highlight';
  import type { TableConstructorOptions } from 'cli-table3';
  import type { MarkedExtension } from 'marked';

  export interface RendererOptions {
    code: (s: string) => string;
    blockquote: (s: string) => string;
    html: (s: string) => string;
    heading: (s: string) => string;
    firstHeading: (s: string) => string;
    hr: (s: string) => string;
    listitem: (s: string) => string;
    list: (body: string, ordered: boolean, tab: string) => string;
    table: (s: string) => string;
    paragraph: (s: string) => string;
    strong: (s: string) => string;
    em: (s: string) => string;
    codespan: (s: string) => string;
    del: (s: string) => string;
    link: (s: string) => string;
    href: (s: string) => string;
    text: (s: string) => string;
    unescape: boolean;
    emoji: boolean;
    width: number;
    showSectionPrefix: boolean;
    reflowText: boolean;
    tab: number | string;
    tableOptions?: TableConstructorOptions | Record<string, unknown>;
  }

  export default class Renderer {
    constructor(options?: Partial<RendererOptions>, highlightOptions?: HighlightOptions);
    textLength(str: string): number;
  }

  export function markedTerminal(
    options?: Partial<RendererOptions>,
    highlightOptions?: HighlightOptions
  ): MarkedExtension;
}
