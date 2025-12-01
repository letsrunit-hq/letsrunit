import {
  Argument,
  CucumberExpression,
  ParameterType,
  ParameterTypeRegistry,
  RegularExpression,
} from '@cucumber/cucumber-expressions';
import { generateMessages } from '@cucumber/gherkin';
import { IdGenerator, Pickle, PickleStep, SourceMediaType } from '@cucumber/messages';
import { ParameterTypeDefinition, sanitizeStepDefinition } from '@letsrunit/gherkin';
import { ParsedStep, Result, StepDefinition, StepHandler, StepType, World } from './types';

export type StepResult = { status: 'success' | 'failure'; reason?: Error };
export type StepDescription = { text: string; args: readonly Argument[] };
type StepWrapper = (step: StepDescription, run: () => Promise<StepResult>) => Promise<StepResult>;

export class Runner<TWorld extends World> {
  private _registry = new ParameterTypeRegistry(); // Private instead of readonly, because `reset()`

  get registry(): ParameterTypeRegistry {
    return this._registry;
  }

  private _defs: StepDefinition<TWorld>[] = [];

  get defs(): StepDefinition<TWorld>[] {
    return this._defs;
  }

  defineStep(type: StepType, expression: string | RegExp, fn: StepHandler<TWorld>, comment?: string) {
    const expr =
      typeof expression === 'string'
        ? new CucumberExpression(sanitizeStepDefinition(expression), this.registry)
        : new RegularExpression(expression, this.registry);
    this.defs.push({ type, expr, fn, source: String(expression), comment });
  }

  defineParameterType(type: ParameterTypeDefinition<unknown>) {
    const paramType = new ParameterType(type.name, type.regexp, null, type.transformer, type.useForSnippets);

    this._registry.defineParameterType(paramType);
  }

  parse(feature: string): ParsedStep[] {
    const pickles = this.compile(feature);
    if (pickles.length > 1) {
      throw new Error('Multiple scenarios not supported');
    }

    const pickle = pickles[0];

    return pickle.steps.map((step) => {
      const match = this.match(step.text);

      return {
        text: step.text,
        def: match?.def ? `${match?.def.type} ${match?.def.source}` : undefined,
        values: match?.values,
      };
    });
  }

  async run(
    feature: string,
    worldFactory: TWorld | (() => Promise<TWorld> | TWorld),
    wrapRun?: StepWrapper,
  ): Promise<Result<TWorld>> {
    const pickles = this.compile(feature);
    if (pickles.length > 1) {
      throw new Error('Multiple scenarios not supported');
    }

    wrapRun ??= (_step, run) => run();

    const world = typeof worldFactory === 'function' ? await worldFactory() : worldFactory;
    const pickle = pickles[0];
    let completed = 0;
    let error: Error | undefined;

    for (const step of pickle.steps) {
      try {
        const { status, reason } = await wrapRun(this.describeStep(step), () => this.runStep(world, step));

        if (status === 'success') completed++;

        if (status === 'failure') {
          error = reason ?? new Error('Unknown error');
          break;
        }
      } catch (e) {
        error = e as Error;
        break;
      }
    }

    if (typeof world.cleanup === 'function') await world.cleanup();

    const steps = pickle.steps.map((step, i) => ({
      text: step.text,
      status:
        completed > i ? 'success' : ((completed === i ? 'failure' : undefined) as 'success' | 'failure' | undefined),
    }));

    return { world, status: !error ? 'passed' : 'failed', steps, reason: error };
  }

  reset() {
    this._registry = new ParameterTypeRegistry();
    this._defs = [];
  }

  private match(text: string) {
    for (const def of this.defs) {
      const args = def.expr.match(text);
      if (args) return { def, values: args.map((a) => a.getValue(null)) };
    }
    return null;
  }

  private describeStep(step: PickleStep): StepDescription {
    const def = this.defs.find(({ expr }) => !!expr.match(step.text));

    const text = def ? `${def.type} ${step.text}` : step.text;
    const args = def?.expr.match(step.text) || [];

    return { text, args };
  }

  private compile(feature: string, uri = 'inline.feature') {
    const envelopes = generateMessages(feature, uri, SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN, {
      newId: () => IdGenerator.uuid().toString(),
      includeGherkinDocument: true,
      includePickles: true,
      includeSource: false,
    });
    const pickles = envelopes.filter((e) => e.pickle).map((e) => e.pickle!) as Pickle[];
    if (!pickles.length) throw new Error('No scenarios found');
    return pickles;
  }

  private async runStep(world: TWorld, step: PickleStep): Promise<StepResult> {
    try {
      const text = step.text;
      const match = this.match(text);

      if (!match) throw new Error(`Undefined step: ${text}`);

      // DocString/DataTable
      let extra: any | undefined;
      if (step.argument?.docString) {
        extra = step.argument.docString.content;
      } else if (step.argument?.dataTable) {
        extra = step.argument.dataTable.rows.map((r) => r.cells.map((c) => c.value));
      }

      await match.def.fn(world, ...match.values, ...(extra !== undefined ? [extra] : []));

      return { status: 'success' };
    } catch (e) {
      return { status: 'failure', reason: e as Error };
    }
  }
}
