import { generateMessages } from '@cucumber/gherkin';
import { IdGenerator, Pickle, PickleStep, SourceMediaType } from '@cucumber/messages';
import { CucumberExpression, ParameterTypeRegistry, RegularExpression, } from '@cucumber/cucumber-expressions';
import { Compiled, Result, StepHandler, StepType, World } from './types';

export class Runner<TWorld extends World> {
  private _registry = new ParameterTypeRegistry();
  private _defs: Compiled<TWorld>[] = [];

  get registry(): ParameterTypeRegistry {
    return this._registry;
  }

  get defs(): Compiled<TWorld>[] {
    return this._defs;
  }

  defineStep(type: StepType, expression: string | RegExp, fn: StepHandler<TWorld>, comment?: string) {
    const expr =
      typeof expression === 'string'
        ? new CucumberExpression(expression, this.registry)
        : new RegularExpression(expression, this.registry);
    this.defs.push({ type, expr, fn, source: String(expression), comment });
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

  async run(feature: string, worldFactory: TWorld | (() => Promise<TWorld> | TWorld)): Promise<Result<TWorld>> {
    const pickles = this.compile(feature);
    if (pickles.length > 1) {
      throw new Error('Multiple scenarios not supported')
    }

    const world = typeof worldFactory === 'function' ? await worldFactory() : worldFactory;
    const pickle = pickles[0];
    let completed = 0;
    let error: Error | undefined;

    try {
      for (const step of pickle.steps) {
        await this.runStep(world, step);
        completed++;
      }
    } catch (e) {
      error = e as Error;
    } finally {
      if (typeof world.cleanup === 'function') await world.cleanup();
    }

    const steps = pickle.steps.map((step, i) => ({
      text: step.text,
      status: completed > i ? 'success' : (completed === i ? 'failure' : undefined) as
        'success' | 'failure' | undefined,
    }));

    return { world, status: !error ? 'success' : 'failure', steps, reason: error };
  }

  private async runStep(world: TWorld, step: PickleStep) {
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

  reset() {
    this._registry = new ParameterTypeRegistry();
    this._defs = [];
  }
}
