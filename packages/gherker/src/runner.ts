import type { Argument } from '@cucumber/cucumber-expressions';
import { generateMessages } from '@cucumber/gherkin';
import { IdGenerator, Pickle, PickleStep, SourceMediaType } from '@cucumber/messages';
import type { ParameterTypeDefinition } from '@letsrunit/gherkin';
import { DefaultStepRegistry } from './step-registry';
import type { IStepRegistry, ParsedStep, Result, StepEntry, StepHandler, StepType, World } from './types';

export type StepResult = { status: 'success' | 'failure'; reason?: Error };
export type StepDescription = { id: string; text: string; args: readonly Argument[] };
type StepWrapper = (step: StepDescription, run: () => Promise<StepResult>) => Promise<StepResult>;

export class Runner<TWorld extends World> {
  private _stepRegistry: IStepRegistry<TWorld> = new DefaultStepRegistry();

  get defs(): ReadonlyArray<StepEntry<TWorld>> {
    return this._stepRegistry.defs;
  }

  useRegistry(registry: IStepRegistry<TWorld>): void {
    this._stepRegistry = registry;
  }

  defineStep(type: StepType, expression: string | RegExp, fn: StepHandler<TWorld>, comment?: string): void {
    this._stepRegistry.defineStep(type, expression, fn, comment);
  }

  defineParameterType(type: ParameterTypeDefinition<unknown>): void {
    this._stepRegistry.defineParameterType(type);
  }

  parse(feature: string): ParsedStep[] {
    const pickles = this.compile(feature);
    if (pickles.length > 1) {
      throw new Error('Multiple scenarios not supported');
    }

    const pickle = pickles[0];

    return pickle.steps.map((step) => {
      const match = this._stepRegistry.match(step.text);

      return {
        text: step.text,
        def: match?.def ? `${match.def.type} ${match.def.source}` : undefined,
        values: match?.values,
      };
    });
  }

  async run(
    feature: string,
    worldFactory: TWorld | (() => Promise<TWorld> | TWorld),
    wrapRun?: StepWrapper,
    { signal }: { signal?: AbortSignal } = {},
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
      if (signal?.aborted) {
        error = signal.reason instanceof Error ? signal.reason : new Error(String(signal.reason));
        break;
      }

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

  reset(): void {
    this._stepRegistry = new DefaultStepRegistry();
  }

  private describeStep(step: PickleStep): StepDescription {
    const match = this._stepRegistry.match(step.text);
    const text = match ? `${match.def.type} ${step.text}` : step.text;
    const args = match?.args ?? [];
    return { id: step.id, text, args };
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
      const match = this._stepRegistry.match(text);

      if (!match) throw new Error(`Undefined step: ${text}`);

      // DocString/DataTable
      let extra: any | undefined;
      if (step.argument?.docString) {
        extra = step.argument.docString.content;
      } else if (step.argument?.dataTable) {
        extra = step.argument.dataTable.rows.map((r) => r.cells.map((c) => c.value));
      }

      await match.def.fn.apply(world, [...match.values, ...(extra !== undefined ? [extra] : [])]);

      return { status: 'success' };
    } catch (e) {
      return { status: 'failure', reason: e as Error };
    }
  }
}
