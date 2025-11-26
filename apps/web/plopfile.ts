import { NodePlopAPI } from 'plop';

export default function (plop: NodePlopAPI) {
  // -------- Helpers --------
  const ensureAppPath = (p) => p.replace(/^\/+|\/+$/g, '');
  const toKebab = (s: string) =>
    String(s)
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[_\s]+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();

  // -------- React Component --------
  plop.setGenerator('component', {
    description: 'Create a React component with test',
    prompts: [{ type: 'input', name: 'name', message: 'Component name (e.g. CommitButton):' }],
    actions: [
      {
        type: 'add',
        path: '{{resolveBase "src/components"}}/{{dashCase name}}/{{dashCase name}}.tsx',
        template: `import React from 'react';

export type {{pascalCase name}}Props = {
  className?: string;
  children?: React.ReactNode;
};

export function {{pascalCase name}}({ className, children }: {{pascalCase name}}Props) {
  return <div className={className}>{{pascalCase name}}{children ? <>: {children}</> : null}</div>;
}

export default {{pascalCase name}};`,
      },
      {
        type: 'add',
        path: '{{resolveBase "src/components"}}/{{dashCase name}}/{{dashCase name}}.test.tsx',
        template: `import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { {{pascalCase name}} } from './{{dashCase name}}';

describe('{{pascalCase name}}', () => {
  it('renders', () => {
    render(<{{pascalCase name}}>Hello</{{pascalCase name}}>);
    expect(screen.getByText(/{{pascalCase name}}/)).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });
});`,
      },
      {
        type: 'add',
        path: '{{resolveBase "src/components"}}/{{dashCase name}}/index.ts',
        template: `export * from './{{dashCase name}}';`,
      },
    ],
  });

  // -------- Next.js Page (app router) --------
  plop.setGenerator('page', {
    description: 'Create app/<path>/page.tsx + test',
    prompts: [{ type: 'input', name: 'path', message: 'Route segment, e.g. blog/post:' }],
    actions: [
      {
        type: 'add',
        path: 'src/app/{{kebabPath path}}/page.tsx',
        template: `import React from 'react';

export default function Page() {
  return <main>{{dashCase path}} page</main>;
}`,
      },
      {
        type: 'add',
        path: 'src/app/{{kebabPath path}}/page.test.tsx',
        template: `import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from './page';

describe('page {{dashCase path}}', () => {
  it('renders', () => {
    render(<Page />);
  });
});`,
      },
    ],
  });

  // -------- Next.js Layout (app router) --------
  plop.setGenerator('layout', {
    description: 'Create app/<path>/layout.tsx + test',
    prompts: [{ type: 'input', name: 'path', message: 'Segment for layout, e.g. dashboard:' }],
    actions: [
      {
        type: 'add',
        path: 'src/app/{{kebabPath path}}/layout.tsx',
        template: `import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <section data-segment="{{appPath path}}">{children}</section>;
}`,
      },
      {
        type: 'add',
        path: 'src/app/{{kebabPath path}}/layout.test.tsx',
        template: `import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Layout from './layout';

describe('layout {{appPath path}}', () => {
  it('wraps children', () => {
    render(<Layout><div>child</div></Layout>);
  });
});`,
      },
    ],
  });

  // -------- Next.js Route Handler (app router) --------
  plop.setGenerator('route', {
    description: 'Create app/<path>/route.ts (GET) + test',
    prompts: [{ type: 'input', name: 'path', message: 'API segment, e.g. api/ping:' }],
    actions: [
      {
        type: 'add',
        path: 'src/app/{{kebabPath path}}/route.ts',
        template: `export async function GET() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
}`,
      },
      {
        type: 'add',
        path: 'src/app/{{kebabPath path}}/route.test.ts',
        template: `import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('route {{dashCase path}}', () => {
  it('returns ok', async () => {
    const res = await GET();
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
  });
});`,
      },
    ],
  });

  // -------- React Hook --------
  plop.setGenerator('hook', {
    description: 'Create a React hook with test',
    prompts: [{ type: 'input', name: 'name', message: 'Hook name without "use" prefix, e.g. Toggle:' }],
    actions: [
      {
        type: 'add',
        path: '{{resolveBase "src/hooks"}}/use-{{dashCase name}}.ts',
        template: `import { useState } from 'react';

export function use{{pascalCase name}}(initial = false) {
  const [value, setValue] = useState<boolean>(initial);
  const toggle = () => setValue((v) => !v);
  return { value, setValue, toggle };
}
export default use{{pascalCase name}};`,
      },
      {
        type: 'add',
        path: '{{resolveBase "src/hooks"}}/__tests__/use-{{dashCase name}}.test.ts',
        template: `import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { use{{pascalCase name}} } from './use-{{dashCase name}}';

describe('use{{pascalCase name}}', () => {
  it('toggles', () => {
    const { result } = renderHook(() => use{{pascalCase name}}());
    act(() => result.current.toggle());
    expect(result.current.value).toBe(true);
  });
});`,
      },
    ],
  });

  // -------- React Context --------
  plop.setGenerator('context', {
    description: 'Create a React context + provider with test',
    prompts: [{ type: 'input', name: 'name', message: 'Context name, e.g. Theme:' }],
    actions: [
      {
        type: 'add',
        path: '{{resolveBase "src/context"}}/{{dashCase name}}-context.tsx',
        template: `import React, { createContext, useContext, useState } from 'react';

type {{pascalCase name}}Value = { value: string; setValue: (v: string) => void };
const Ctx = createContext<{{pascalCase name}}Value | undefined>(undefined);

export function {{pascalCase name}}Provider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState('default');
  return (
    <Ctx.Provider value={(() => ({ value, setValue }))()}>{children}</Ctx.Provider>
  );
}

export function use{{pascalCase name}}() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('use{{pascalCase name}} must be used within {{pascalCase name}}Provider');
  return ctx;
}`,
      },
      {
        type: 'add',
        path: '{{resolveBase "src/context"}}/{{dashCase name}}-context.test.tsx',
        template: `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { {{pascalCase name}}Provider, use{{pascalCase name}} } from './{{dashCase name}}-context';

function Demo() {
  const { value } = use{{pascalCase name}}();
  return <div>{value}</div>;
}

describe('{{pascalCase name}}Context', () => {
  it('provides default value', () => {
    render(<{{pascalCase name}}Provider><Demo /></{{pascalCase name}}Provider>);
    expect(screen.getByText('default')).toBeInTheDocument();
  });
});`,
      },
    ],
  });

  // -------- Server Action --------
  plop.setGenerator('action', {
    description: 'Create a server action with "use server"',
    prompts: [{ type: 'input', name: 'name', message: 'Action name, e.g. createUser:' }],
    actions: [
      {
        type: 'add',
        path: '{{resolveBase "src/actions"}}/{{dashCase name}}.ts',
        template: `'use server';

export async function {{camelCase name}}(...args: any[]) {
  // implement server action {{camelCase name}}
  return { ok: true };
}
`,
      },
      {
        type: 'add',
        path: '{{resolveBase "src/actions"}}/__tests__/{{dashCase name}}.test.ts',
        template: `import { describe, it, expect } from 'vitest';
import { {{camelCase name}} } from '../{{dashCase name}}';

describe('action {{camelCase name}}', () => {
  it('returns ok: true', async () => {
    const res = await {{camelCase name}}();
    expect(res).toEqual({ ok: true });
  });
});`,
      },
    ],
  });

  // -------- Library util --------
  plop.setGenerator('lib', {
    description: 'Create a library util in src/libs',
    prompts: [{ type: 'input', name: 'name', message: 'Lib name, e.g. formatDate:' }],
    actions: [
      {
        type: 'add',
        path: '{{resolveBase "src/libs"}}/{{dashCase name}}.ts',
        template: `export function {{camelCase name}}(...args: any[]) {
  // implement lib {{camelCase name}}
}`,
      },
      {
        type: 'add',
        path: '{{resolveBase "src/libs"}}/__tests__/{{dashCase name}}.test.ts',
        template: `import { describe, it, expect } from 'vitest';
import { {{camelCase name}} } from '../{{dashCase name}}';

describe('lib {{camelCase name}}', () => {
  it('is a function', () => {
    expect(typeof {{camelCase name}}).toBe('function');
  });
});`,
      },
    ],
  });

  // Normalize any path-like prompt without overriding default helpers
  plop.setHelper('appPath', (txt) => ensureAppPath(String(txt)));
  plop.setHelper('kebabPath', (txt) => {
    const parts = ensureAppPath(String(txt)).split('/').filter(Boolean);
    return parts.map((p) => toKebab(p)).join('/');
  });

  // Resolve base directory: prefer CLI --baseDir, otherwise use provided default
  plop.setHelper('resolveBase', function (defaultDir: string, options: any) {
    const root = options?.data?.root ?? {};
    // If user provided --baseDir via CLI, use it; else fallback to defaultDir
    const provided = root.baseDir;
    return String(provided || defaultDir);
  });
}
