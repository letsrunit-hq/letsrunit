import { generateMessages } from '@cucumber/gherkin';
import { Pickle, SourceMediaType } from '@cucumber/messages';
import {
  CucumberExpression,
  Expression,
  ParameterType,
  ParameterTypeRegistry,
  RegularExpression,
} from '@cucumber/cucumber-expressions';
import { compileLocator } from '@letsrunit/gherkin';
import { Page } from '@playwright/test';

export type World = { page: Page, [_: string]: any };
export type StepHandler = (world: World, ...args: any[]) => Promise<void> | void;

type StepType = 'Given' | 'When' | 'Then';
type Compiled = { type: StepType, expr: Expression; fn: StepHandler; source: string };

export class Runner {
  private registry = new ParameterTypeRegistry();
  private defs: Compiled[] = [];

  constructor() {
    this.defineCustomParameterTypes();
  }

  define(type: StepType, expression: string | RegExp, fn: StepHandler) {
    const expr =
      typeof expression === 'string'
        ? new CucumberExpression(expression, this.registry)
        : new RegularExpression(expression, this.registry);
    this.defs.push({ type, expr, fn, source: String(expression) });
  }

  private match(text: string) {
    for (const d of this.defs) {
      const args = d.expr.match(text);
      if (args) return { d, values: args.map((a) => a.getValue(null)) };
    }
    return null;
  }

  compile(feature: string, uri = 'inline.feature') {
    const envelopes = generateMessages(feature, uri, SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN, {
      includeGherkinDocument: true,
      includePickles: true,
      includeSource: false,
    });
    const pickles = envelopes
      .filter((e) => e.pickle)
      .map((e) => e.pickle!) as Pickle[];
    if (!pickles.length) throw new Error('No scenarios found');
    return pickles;
  }

  async run(feature: string, worldFactory: () => Promise<World> | World) {
    const pickles = this.compile(feature);
    if (pickles.length > 1) {
      throw new Error('Multiple scenarios not supported')
    }

    const world = await worldFactory();
    const pickle = pickles[0];

    try {
      for (const step of pickle.steps) {
        const text = step.text;
        const m = this.match(text);
        if (!m) throw new Error(`Undefined step: ${text}`);

        // DocString/DataTable als laatste arg
        let extra: any | undefined;
        if (step.argument?.docString) {
          extra = step.argument.docString.content;
        } else if (step.argument?.dataTable) {
          extra = step.argument.dataTable.rows.map((r) => r.cells.map((c) => c.value));
        }

        await m.d.fn(world, ...m.values, ...(extra !== undefined ? [extra] : []));
      }
    } finally {
      if (typeof world.cleanup === 'function') await world.cleanup();
    }

    return world;
  }

  private defineCustomParameterTypes() {
    this.registry.defineParameterType(
      new ParameterType<string>(
        'locator',
        /(\w+)(?: +"(?:[^"\\]+|\\.)*"| +\/(?:[^\/\\]+|\\.)*\/| *#[\w-]+)?|`.+`(?: +with(?:out|in)? +(\w+)(?: +"(?:[^"\\]+|\\.)*"| +\/(?:[^\/\\]+|\\.)*\/| *#[\w-]+)?|`.+`)*/,
        String,
        (locator: string) => compileLocator(locator),
        false,
      )
    );
    this.registry.defineParameterType(
      new ParameterType<string | number | boolean>(
        'scalar',
        /true|false|"(.*?)"|-?\d+(?:\.\d+)?/,
        null,
        (value: string, str: string): string | number | boolean => {
          if (str) return str;
          if (value === 'true' || value === 'false') return value === 'true';
          if (!isNaN(Number(value))) return Number(value);

          throw new Error("Unexpected value");
        },
        false,
      ),
    );

  }
}
