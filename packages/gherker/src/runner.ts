import { generateMessages } from '@cucumber/gherkin';
import { IdGenerator, Pickle, SourceMediaType } from '@cucumber/messages';
import {
  CucumberExpression,
  Expression,
  ParameterTypeRegistry,
  RegularExpression,
} from '@cucumber/cucumber-expressions';

type World = { cleanup?: () => void | Promise<void>; [_: string]: any}
export type StepHandler<T> = (world: T, ...args: any[]) => Promise<void> | void;

type StepType = 'Given' | 'When' | 'Then';
type Compiled<T> = { type: StepType, expr: Expression; fn: StepHandler<T>; source: string };

export class Runner<TWorld extends World> {
  public readonly registry = new ParameterTypeRegistry();
  public readonly defs: Compiled<TWorld>[] = [];

  defineStep(type: StepType, expression: string | RegExp, fn: StepHandler<TWorld>) {
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
      newId: () => IdGenerator.uuid().toString(),
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

  async run(feature: string, worldFactory: () => Promise<TWorld> | TWorld): Promise<TWorld> {
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

        // DocString/DataTable
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
}
