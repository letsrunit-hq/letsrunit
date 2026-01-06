import { generate } from '@letsrunit/ai';
import { Controller, Result as StepResult } from '@letsrunit/controller';
import { deltaSteps, type Feature, makeFeature, parseFeature } from '@letsrunit/gherkin';
import { Journal } from '@letsrunit/journal';
import { receiveMail } from '@letsrunit/mailbox';
import type { Snapshot } from '@letsrunit/playwright';
import { splitUrl, statusSymbol, textToHtml } from '@letsrunit/utils';
import type { ModelMessage, ToolSet } from 'ai';
import * as z from 'zod';
import type { Result } from '../types';
import { analyseEmail } from './analyse-email';
import { describePage } from './describe-page';
import { detectPageChanges } from './detect-page-changes';
import { locatorRules } from './locator-rules';

const MAX_TRIES = 3;
const MAX_ROUNDS = 10;

const PROMPT = `You're a QA tester, tasked with writing BDD tests in Gherkin format for a feature.

You will receive the page content from the user. Your job is to:
- Incrementally add \`When\` steps to complete a **single Gherkin scenario**
- Use tools if additional information is needed to determine the next \`When\` step
- End the process by calling \`publish()\` once the scenario is fully satisfied

## Completion Criteria

Only call \`publish()\` if the **user goal has been met**, based on the definition of done described in the scenario.
You must:
1. Verify that all actions required to achieve the user story are complete
2. Confirm the presence of a final UI state (e.g. confirmation message, generated link, visible output) in the HTML

**If these conditions are not met, do NOT call \`publish()\` yet. Continue adding relevant \`When\` steps.**

## Allowed \`When\` Steps:

Only use the following \`When\` steps:
{{#steps}}
  - {{.}}
{{/steps}}

## Parameters

* \`{locator}\` - A readable description of a page element
* \`{keys}\` - Keyboard input like "Enter" or "CTRL + S"
* \`{value}\` - A string, number, or date, for example "Hello", 10, \`date of tomorrow\`, or \`date "2026-02-22"\`

**Locator rules**:
${locatorRules}

**Hint**:
Use relative dates for \`{locator}\` and \`{value}\` when the date is calculated from or depends on the current time,
and use fixed dates only when the date is explicitly defined, historical, or must match an exact calendar value.

## Workflow

The interaction follows this loop:

assistant: Gherkin feature
user: HTML page snapshot
assistant: add new \`When\` steps if needed
user: new HTML page snapshot or BDD run error
assistant: continue or call \`publish()\` if scenario goal is met

Do not add \`Given\` or \`Then\` steps.
Do not output the current feature without adding steps

**Special Rules**:
- Do not add further steps once a \`link\` is clicked (indicating page navigation)
- Do not add \`When\` steps for elements that are not visible (yet)
- You must add one or more steps OR call publish
{{#language}}- Use the {{language}} locale for number and date formatting{{/language}}

{{#hasAccounts}}
**Available accounts**:
{{#accounts}}
{{.}}
{{/accounts}}
{{/hasAccounts}}
`;

interface Options {
  controller: Controller;
  page?: Snapshot & { content?: string; lang?: string };
  feature: Feature;
  appInfo?: {
    purpose: string;
    loginAvailable: boolean;
  };
  accounts?: Record<string, string>;
  signal?: AbortSignal;
}

// Context used during generation.
interface GenerationContext {
  controller: Controller;
  feature: Feature;
  rounds: number;
  isDone: boolean;
  steps: string[];
  whenSteps: string[];
  messages: ModelMessage[];
  content: string;
  currentPage: Snapshot;
  language?: string;
  accountList: string[];
  mailAfter: number;
  signal?: AbortSignal;
}

const checkMailboxTool = {
  description: 'Call this tools when you expected a mail to be delivered based on the HTML or last step.',
  inputSchema: z.object({
    address: z.string().describe('email address of the mail account'),
  }),
  outputSchema: z.string(),
};

async function determineThenSteps(old: Snapshot, current: Snapshot, journal?: Journal): Promise<string[]> {
  let steps: string[];

  if (old.url !== current.url) {
    const { path } = splitUrl(current.url);
    steps = [`Then I should be on page "${path}"`];
  } else {
    steps = await detectPageChanges(old, current, { journal });
  }

  return steps;
}

function invalidToMessages(
  feature: Feature | string,
  validatedSteps: { text: string; def?: string }[],
): ModelMessage[] {
  const invalidSteps = validatedSteps.filter((step) => !step.def);
  const userMessage = [
    `The following steps are do not have a step definition or are invalid:`,
    ...invalidSteps.map((s) => `- ${s}`),
  ].join('\n');

  return [
    { role: 'assistant', content: typeof feature === 'string' ? feature : makeFeature(feature) },
    { role: 'user', content: userMessage },
  ];
}

async function failureToMessages(feature: Feature | string, result: StepResult): Promise<ModelMessage[]> {
  const userMessage = [
    ...result.steps.map((s) => `${statusSymbol(s.status)} ${s.text}`),
    '',
    result.reason,
    '',
    '---',
    '',
    await describePage(result.page, 'html'),
  ].join('\n');

  return [
    { role: 'assistant', content: typeof feature === 'string' ? feature : makeFeature(feature) },
    { role: 'user', content: userMessage },
  ];
}

async function initGeneration({ controller, feature, accounts, signal }: Options): Promise<GenerationContext> {
  const whenSteps = controller.listSteps('When');

  const { page } = await controller.run(
    makeFeature({ ...feature, steps: feature.background ?? [], background: undefined }),
  );

  const content = await describePage(page, 'html');
  const accountList = Object.entries(accounts ?? {}).map(([k, v]) => `${k}: ${v}`);

  return {
    controller,
    feature,
    rounds: 0,
    isDone: false,
    steps: [...feature.steps],
    whenSteps,
    messages: [
      { role: 'assistant', content: makeFeature({ ...feature, steps: [...feature.steps] }) },
      { role: 'user', content },
    ],
    content,
    currentPage: page,
    language: controller.lang?.name,
    accountList,
    mailAfter: Date.now(),
    signal,
  };
}

function buildSystemPrompt(ctx: GenerationContext) {
  return {
    template: PROMPT,
    vars: {
      steps: ctx.whenSteps,
      language: ctx.language,
      hasAccounts: ctx.accountList.length > 0,
      accounts: ctx.accountList,
    },
  } as const;
}

function buildToolset(ctx: GenerationContext): ToolSet | undefined {
  // No tools on the first round
  if (ctx.steps.length <= ctx.feature.steps.length) return undefined;

  return {
    publish: {
      description: 'Publish the feature.',
      inputSchema: z.object({}),
      execute() {
        ctx.isDone = true;
        return 'done';
      },
    },
    checkMailbox: {
      ...checkMailboxTool,
      execute: buildMailboxExecute(ctx),
    },
  };
}

function buildMailboxExecute(ctx: GenerationContext) {
  return async ({ address }: { address: string }): Promise<string> => {
    await ctx.controller.journal.debug(`Checking email in mailbox "${address}"`);

    const emails = await receiveMail(address, { wait: true, after: ctx.mailAfter, full: true });
    ctx.mailAfter = Date.now();
    if (emails.length === 0) return 'No mail received';

    const email = emails[0];

    // Don't run `Then` step, we've already established this
    const thenStep = `Then mailbox "${address}" received an email with subject "${email.subject}"`;
    await ctx.controller.journal.success(thenStep);
    ctx.steps.push(thenStep);

    const { otp, cta } = await analyseEmail(textToHtml(email.html ?? textToHtml(email.text!)));

    if (!otp && !cta) {
      return `Processed email "${email.subject}"`;
    }

    // Run `Given` step, it will open the email in the browser
    const steps = [`Given I'm viewing an email sent to "${address}" with subject "${email.subject}"`];
    if (otp) steps.push(`When I copy \`${otp.selector}\` to the clipboard`);
    if (cta) steps.push(`When I click \`${cta.selector}\``);
    if (!cta) steps.push('When I go back to the previous page');

    const result = await ctx.controller.run(makeFeature({ name: 'handle email', steps }), { signal: ctx.signal });

    addSuccessfulSteps(ctx, result);

    if (result.status !== 'passed') {
      await ctx.controller.journal.warn('Failed to view email; skipping');
      return `Could not open email "${email.subject}".`;
    }

    await finalizeSuccess(ctx, result);

    return `Processed email "${email.subject}"`;
  };
}

async function nextStepsFromLLM(
  ctx: GenerationContext,
  system: ReturnType<typeof buildSystemPrompt>,
  tools?: ToolSet,
): Promise<{ responseText: string; nextSteps: string[] } | undefined> {
  const response = await generate(system, ctx.messages, {
    tools,
    model: 'medium',
    reasoningEffort: 'low',
    abortSignal: ctx.signal,
  });
  if (!response) return undefined; // Tool call was executed, no need to do anything

  const { steps: responseSteps } = parseFeature(response);
  const nextSteps = deltaSteps(ctx.steps, responseSteps).filter((s) => s.match(/^when\b/i));

  if (nextSteps.length === 0) {
    console.warn('No new steps generated; try again');
    ctx.messages.push({
      role: 'user',
      content: 'You need to either add steps or call `publish`, not return the feature as is.',
    });
    return undefined;
  }

  return { responseText: response, nextSteps };
}

function addSuccessfulSteps(ctx: GenerationContext, result: Pick<StepResult, 'steps'>) {
  ctx.steps.push(...result.steps.filter((s) => s.status === 'success').map(({ text }) => text));
}

async function validateAndRun(
  ctx: GenerationContext,
  responseText: string,
  nextSteps: string[],
): Promise<StepResult | undefined> {
  const next = makeFeature({ name: 'continue', steps: nextSteps });
  const { valid, steps: validatedSteps } = ctx.controller.validate(next);
  if (!valid) {
    ctx.messages.push(...invalidToMessages(responseText, validatedSteps));
    return undefined;
  }

  const result = await ctx.controller.run(next, { signal: ctx.signal });
  addSuccessfulSteps(ctx, result);

  if (result.status === 'failed') {
    ctx.messages.push(...(await failureToMessages(responseText, result)));
    return undefined;
  }

  return result;
}

async function finalizeSuccess(ctx: GenerationContext, result: StepResult): Promise<void> {
  const { page: nextPage } = result;
  ctx.content = await describePage(nextPage, 'html');

  const assertSteps = await determineThenSteps(ctx.currentPage, nextPage, ctx.controller.journal);
  await ctx.controller.run(makeFeature({ name: 'assert', steps: assertSteps }));
  ctx.steps.push(...assertSteps);

  ctx.currentPage = nextPage;
  ctx.messages = [
    { role: 'assistant', content: makeFeature({ ...ctx.feature, steps: ctx.steps }) },
    { role: 'user', content: ctx.content },
  ];
}

export async function generateFeature(opts: Options): Promise<Result> {
  const ctx = await initGeneration(opts);
  const system = buildSystemPrompt(ctx);

  while (true) {
    if (ctx.messages.length > 2 * MAX_TRIES || ctx.rounds++ >= MAX_ROUNDS || ctx.signal?.aborted) {
      await ctx.controller.journal.error('Failed to generate feature; returning partial feature');
      return {
        status: 'failed',
        feature: { ...ctx.feature, steps: ctx.steps, comments: 'Generation of this feature failed' },
      };
    }

    const tools = buildToolset(ctx);
    const proposed = await nextStepsFromLLM(ctx, system, tools);

    if (!proposed) {
      if (ctx.isDone) break;
      continue;
    }

    const result = await validateAndRun(ctx, proposed.responseText, proposed.nextSteps);
    if (!result) continue;

    await finalizeSuccess(ctx, result);
  }

  return { status: 'passed', feature: { ...ctx.feature, steps: ctx.steps, comments: undefined } };
}
