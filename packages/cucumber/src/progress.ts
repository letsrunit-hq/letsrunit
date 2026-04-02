import { formatterHelpers, type IFormatterOptions, ProgressFormatter as Base } from '@cucumber/cucumber';
import { normalizeSteps } from '@letsrunit/gherkin';
import { computeScenarioId, computeStepId, findLastPassingBaseline, openStore } from '@letsrunit/store';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
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

function toScenarioId(testSteps: ParsedStep[]): string | null {
  const scenarioSteps = testSteps.filter((step) => step.text !== undefined);
  if (scenarioSteps.length === 0) return null;

  const normalized = normalizeSteps(
    scenarioSteps.map((step) => ({
      keyword: step.keyword,
      text: step.text ?? '',
      docString: step.argument?.docString,
      dataTable: step.argument?.dataTable,
    })),
  );
  return computeScenarioId(normalized.map((text) => computeStepId(text)));
}

function resolveAllowedCommits(): string[] | undefined {
  try {
    const output = execSync('git log --format=%H', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return undefined;
  }
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

function trimLocator(locator: string): string {
  const raw = locator.trim();
  const match = raw.match(/^locator\((['"`])(.*)\1\)(?:\.[A-Za-z_]\w*\([^)]*\))*$/);
  if (!match) return raw;
  return match[2];
}

function isStackLine(line: string): boolean {
  return /^\s*at\s+/.test(line);
}

function extractLocator(lines: string[]): string | undefined {
  const locatorLine = lines.find((line) => line.trim().startsWith('Locator:'));
  if (!locatorLine) return undefined;
  const raw = locatorLine.replace(/^\s*Locator:\s*/, '').trim();
  return raw ? trimLocator(raw) : undefined;
}

function extractUrl(lines: string[]): string | undefined {
  for (const line of lines) {
    const match = line.match(/\bURL:\s*(\S+)/i);
    if (match) return match[1];
  }
  return undefined;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
  } catch {
    return url.trim();
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

function extractError(lines: string[]): string | undefined {
  const callLogIdx = lines.findIndex((line) => line.trim().startsWith('Call log:'));
  const stackIdx = lines.findIndex(isStackLine);
  let cutOff = lines.length;
  if (callLogIdx >= 0) cutOff = Math.min(cutOff, callLogIdx);
  if (stackIdx >= 0) cutOff = Math.min(cutOff, stackIdx);

  const candidates: string[] = [];
  for (let i = 0; i < cutOff; i += 1) {
    const match = lines[i].match(/^\s*Error:\s*(.+)\s*$/);
    if (match) candidates.push(match[1].trim());
  }

  if (candidates.length > 0) return candidates[candidates.length - 1];

  return lines
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !isStackLine(line) && !line.startsWith('Call log:'));
}

export function extractFailureDetails(message?: string): FailureDetails {
  if (!message) return {};
  const lines = message.split('\n');
  return {
    error: extractError(lines),
    locator: extractLocator(lines),
    url: extractUrl(lines),
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
  const line = `   ${char} ${identifier}`;
  return `${colorFns.forStatus(step.result.status)(line)}\n`;
}

function formatFailureDetails(step: ParsedStep, colorFns: IFormatterOptions['colorFns']): string {
  if (!isFailureStatus(step.result.status)) return '';

  const details = extractFailureDetails(step.result.message);
  const urlFromAttachment = extractUrlFromAttachments(step.attachments);
  const url = urlFromAttachment ?? details.url;
  const lines: string[] = [];
  if (url) lines.push(`       URL: ${url}`);
  if (details.locator) lines.push(`       Locator: ${details.locator}`);
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
