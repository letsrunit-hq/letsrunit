import { formatterHelpers, type IFormatterOptions, ProgressFormatter as Base } from '@cucumber/cucumber';
import { findLastPassingBaseline, openStore } from '@letsrunit/store';
import { existsSync } from 'node:fs';
import {
  extractFailureDetails as extractFailureDetailsFromMessage,
  normalizeUrl,
} from './lib/failure-details';
import { resolveAllowedCommits } from './lib/git-commits';
import { toScenarioId } from './lib/scenario-id';
import { getConfiguredStoreDbPath } from './store-config';

const STATUS_CHARACTER_MAPPING = new Map<string, string>([
  ['AMBIGUOUS', '✖'],
  ['FAILED', '✖'],
  ['PASSED', '✔'],
  ['PENDING', '?'],
  ['SKIPPED', '-'],
  ['UNDEFINED', '?'],
]);

type ParsedStep = {
  keyword: string;
  text?: string;
  name?: string;
  result: { status: StepStatus; message?: string };
  attachments?: Array<{ body: string; mediaType: string; fileName?: string }>;
  argument?: {
    docString?: { content: string };
    dataTable?: { rows: ReadonlyArray<{ cells: ReadonlyArray<{ value: string }> }> };
  };
};

type FailureDetails = {
  error?: string;
  locator?: string;
  locatorFuzzy?: boolean;
  url?: string;
};

type LastPassed = {
  line: string;
};

type LogIssuesParam = Parameters<Base['logIssues']>[0];
type StepStatus = Parameters<IFormatterOptions['colorFns']['forStatus']>[0];

function isFailureStatus(status: string): boolean {
  return status === 'FAILED' || status === 'AMBIGUOUS' || status === 'UNDEFINED';
}

function shortCommit(commit: string): string {
  return commit.slice(0, 7);
}

function formatCommit(commit: string, distance: number): string {
  if (distance === 0) return `${shortCommit(commit)} (HEAD)`;
  
  const word = distance === 1 ? 'commit' : 'commits';
  return `${shortCommit(commit)}, ${distance} ${word} ago`;
}

function resolveLastPassedLine({ scenarioId }: { scenarioId: string }): LastPassed | null {
  const dbPath = getConfiguredStoreDbPath();
  if (!dbPath || !existsSync(dbPath)) return null;

  let db: ReturnType<typeof openStore> | undefined;
  try {
    db = openStore(dbPath);
    const allowedCommits = resolveAllowedCommits();
    const baseline = findLastPassingBaseline(db, scenarioId, allowedCommits);
    if (!baseline?.gitCommit) return null;

    const commit = baseline.gitCommit;
    const history = resolveAllowedCommits();
    const distance = history?.findIndex((hash) => hash === commit);
    if (distance === undefined || distance < 0) {
      return { line: `Last passed: commit ${shortCommit(commit)}` };
    }

    return { line: `Last passed: commit ${formatCommit(commit, distance)}` };
  } catch {
    return null;
  } finally {
    db?.close();
  }
}

function extractUrlFromAttachments(attachments?: Array<{ body: string; mediaType: string }>): string | undefined {
  if (!attachments || attachments.length === 0) return undefined;

  for (const attachment of attachments) {
    if (attachment.mediaType === 'text/x-letsrunit-url' || attachment.mediaType === 'text/uri-list') {
      const raw = attachment.body.trim();
      if (raw) return normalizeUrl(raw);
    }
  }

  return undefined;
}

export function extractFailureDetails(message?: string): FailureDetails {
  const details = extractFailureDetailsFromMessage(message);
  return {
    error: details.error,
    locator: details.locator,
    locatorFuzzy: details.locatorFuzzy,
    url: details.url,
  };
}

function formatScenarioLine(
  testCase: { name: string; sourceLocation?: { uri: string; line: number } },
  number: number,
): string {
  const location = testCase.sourceLocation ? ` # ${formatterHelpers.formatLocation(testCase.sourceLocation)}` : '';
  return `${number}) Scenario: ${testCase.name}${location}\n`;
}

function formatStepLine(step: ParsedStep, colorFns: IFormatterOptions['colorFns']): string {
  const char = STATUS_CHARACTER_MAPPING.get(step.result.status) ?? '?';
  const identifier = `${step.keyword}${step.text ?? ''}`;
  const named = step.name ? `${identifier} (${step.name})` : identifier;
  const line = `   ${char} ${named}`;
  return `${colorFns.forStatus(step.result.status)(line)}\n`;
}

function formatFailureDetails(step: ParsedStep, colorFns: IFormatterOptions['colorFns']): string {
  if (!isFailureStatus(step.result.status)) return '';

  const details = extractFailureDetails(step.result.message);
  const urlFromAttachment = extractUrlFromAttachments(step.attachments);
  const url = urlFromAttachment ?? details.url;
  const lines: string[] = [];
  if (url) lines.push(`       URL: ${url}`);
  if (details.locator) {
    const fuzzy = details.locatorFuzzy ? ' {fuzzy}' : '';
    lines.push(`       Locator: ${details.locator}${fuzzy}`);
  }
  if (details.error) lines.push(`       Error: ${details.error}`);
  if (lines.length === 0) return '';

  return `${colorFns.forStatus(step.result.status)(lines.join('\n'))}\n`;
}

export default class ProgressFormatter extends Base {
  static readonly documentation = 'Progress formatter with concise Playwright-aware failure summaries.';

  constructor(options: IFormatterOptions) {
    super(options);
  }

  logIssues({ issues, title }: LogIssuesParam): void {
    if (title !== 'Failures') {
      super.logIssues({ issues, title });
      return;
    }

    this.log(`${title}:\n\n`);

    issues.forEach((testCaseAttempt, index) => {
      const parsed = formatterHelpers.parseTestCaseAttempt({
        snippetBuilder: this.snippetBuilder,
        supportCodeLibrary: this.supportCodeLibrary,
        testCaseAttempt,
      });

      this.log(formatScenarioLine(parsed.testCase, index + 1));

      const scenarioId = toScenarioId(parsed.testSteps as ParsedStep[]);
      if (scenarioId) {
        const lastPassed = resolveLastPassedLine({ scenarioId });
        if (lastPassed) this.log(`${this.colorFns.location(`   ${lastPassed.line}`)}\n`);
      }

      for (const step of parsed.testSteps as ParsedStep[]) {
        this.log(formatStepLine(step, this.colorFns));
        this.log(formatFailureDetails(step, this.colorFns));
      }

      this.log('\n');
    });
  }
}
