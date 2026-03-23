import { AttachmentContentEncoding, TestStepResultStatus, type Envelope } from '@cucumber/messages';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { finaliseRun, insertArtifact, insertRun, insertSession, openStore, upsertFeature, upsertScenario, upsertStep, computeFeatureId, computeStepId, computeScenarioId } from '@letsrunit/store';
import { normalizeStep } from '@letsrunit/gherkin';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_DIR = '.letsrunit/artifacts';

function mimeToExt(mediaType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'text/html': 'html',
    'text/plain': 'txt',
    'application/json': 'json',
    'application/pdf': 'pdf',
  };
  return map[mediaType] ?? 'bin';
}

async function hashBytes(bytes: Uint8Array): Promise<string> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

type AstStep = {
  keyword: string;
  text: string;
  docString?: { content: string };
  dataTable?: { rows: Array<{ cells: Array<{ value: string }> }> };
};

type PickleEntry = {
  featureId: string;
  scenarioId: string;
  steps: { id: string; text: string }[];
};

type TestCaseEntry = {
  pickleId: string;
  scenarioId: string;
  stepIdByTestStepId: Map<string, string>; // testStepId → step db id
};

type RunEntry = {
  runId: string;
  scenarioId: string;
  stepIdByTestStepId: Map<string, string>;
};

type FailureInfo = {
  failedStepId: string;
  error: string | undefined;
};

export default {
  type: 'formatter' as const,
  formatter({ on, directory }: { on: (key: 'message', handler: (value: Envelope) => void) => void; directory?: string }) {
    const artifactDir = directory ?? DEFAULT_DIR;
    mkdirSync(artifactDir, { recursive: true });

    const dbPath = join(artifactDir, '../letsrunit.db');
    const db = openStore(dbPath);

    // Session setup
    const sessionId = uuidv4();
    let gitCommit: string | null = null;
    try { gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(); } catch {}
    insertSession(db, sessionId, gitCommit, Date.now());

    // Correlation maps
    const pickleMap = new Map<string, PickleEntry>();
    // astNodeId → full AST step (keyword, text, docString, dataTable)
    const astStepMap = new Map<string, AstStep>();
    const testCaseMap = new Map<string, TestCaseEntry>();
    const runMap = new Map<string, RunEntry>();
    const pendingFailures = new Map<string, FailureInfo>();

    on('message', (envelope: Envelope) => {
      if (envelope.gherkinDocument) {
        const doc = envelope.gherkinDocument;
        const uri = doc.uri ?? '';

        const featureId = computeFeatureId(uri);
        const featureName = doc.feature?.name ?? '';
        upsertFeature(db, featureId, uri, featureName);

        // Build astNodeId → step map for all steps in this document
        for (const child of doc.feature?.children ?? []) {
          const steps = child.scenario?.steps ?? child.background?.steps ?? child.rule?.children.flatMap(rc => rc.scenario?.steps ?? rc.background?.steps ?? []) ?? [];
          for (const step of steps) {
            astStepMap.set(step.id, {
              keyword: step.keyword.trim(),
              text: step.text,
              docString: step.docString ? { content: step.docString.content } : undefined,
              dataTable: step.dataTable,
            });
          }
        }
        return;
      }

      if (envelope.pickle) {
        const pickle = envelope.pickle;
        const featureId = computeFeatureId(pickle.uri);

        // Compute content-based step IDs using normalized step text.
        // - keyword: from AST (resolving And/But/* to previous canonical keyword)
        // - text: from pickle (compiled — parameters substituted for outlines)
        // - docString/dataTable: from pickle argument (compiled values)
        const steps: { id: string; text: string }[] = [];
        let currentKeyword = 'Given';

        pickle.steps.forEach((ps) => {
          const astStep = astStepMap.get(ps.astNodeIds[0] ?? '');
          let keyword = astStep?.keyword ?? 'Given';
          const lc = keyword.toLowerCase();
          if (lc === 'and' || lc === 'but' || keyword === '*') {
            keyword = currentKeyword;
          } else {
            currentKeyword = keyword;
          }

          const normalized = normalizeStep(
            keyword,
            ps.text,
            ps.argument?.docString ? { content: ps.argument.docString.content } : undefined,
            ps.argument?.dataTable,
          );
          const stepId = computeStepId(normalized);
          steps.push({ id: stepId, text: normalized });
        });

        const scenarioId = computeScenarioId(steps.map((s) => s.id));
        upsertScenario(db, scenarioId, featureId, pickle.name);

        steps.forEach((step, idx) => {
          upsertStep(db, step.id, scenarioId, idx, step.text);
        });

        pickleMap.set(pickle.id, { featureId, scenarioId, steps });
        return;
      }

      if (envelope.testCase) {
        const tc = envelope.testCase;
        const pickleEntry = pickleMap.get(tc.pickleId);
        if (!pickleEntry) return;

        const stepIdByTestStepId = new Map<string, string>();
        let pickleStepIdx = 0;
        for (const ts of tc.testSteps) {
          if (ts.pickleStepId !== undefined && ts.pickleStepId !== '') {
            const step = pickleEntry.steps[pickleStepIdx];
            if (step) {
              stepIdByTestStepId.set(ts.id, step.id);
            }
            pickleStepIdx++;
          }
        }
        testCaseMap.set(tc.id, { pickleId: tc.pickleId, scenarioId: pickleEntry.scenarioId, stepIdByTestStepId });
        return;
      }

      if (envelope.testCaseStarted) {
        const tcs = envelope.testCaseStarted;
        const tcEntry = testCaseMap.get(tcs.testCaseId);
        if (!tcEntry) return;

        const runId = uuidv4();
        insertRun(db, runId, sessionId, tcEntry.scenarioId, Date.now());
        runMap.set(tcs.id, {
          runId,
          scenarioId: tcEntry.scenarioId,
          stepIdByTestStepId: tcEntry.stepIdByTestStepId,
        });
        return;
      }

      if (envelope.testStepFinished) {
        const tsf = envelope.testStepFinished;
        const status = tsf.testStepResult.status;
        const isFailing = status === TestStepResultStatus.FAILED
          || status === TestStepResultStatus.AMBIGUOUS
          || status === TestStepResultStatus.UNDEFINED;

        if (isFailing && !pendingFailures.has(tsf.testCaseStartedId)) {
          const runEntry = runMap.get(tsf.testCaseStartedId);
          const stepId = runEntry?.stepIdByTestStepId.get(tsf.testStepId);
          if (stepId) {
            pendingFailures.set(tsf.testCaseStartedId, {
              failedStepId: stepId,
              error: tsf.testStepResult.message,
            });
          }
        }
        return;
      }

      if (envelope.testCaseFinished) {
        const tcf = envelope.testCaseFinished;
        const failure = pendingFailures.get(tcf.testCaseStartedId);
        pendingFailures.delete(tcf.testCaseStartedId);

        let status: string;
        if (tcf.willBeRetried) {
          status = 'running';
        } else if (failure) {
          status = 'failed';
        } else {
          status = 'passed';
        }

        finaliseRun(db, runMap.get(tcf.testCaseStartedId)?.runId ?? '', status, failure?.failedStepId, failure?.error);
        return;
      }

      if (envelope.attachment) {
        const attachment = envelope.attachment;
        const bytes =
          attachment.contentEncoding === AttachmentContentEncoding.BASE64
            ? Buffer.from(attachment.body, 'base64')
            : Buffer.from(attachment.body, 'utf-8');

        const ext = mimeToExt(attachment.mediaType);

        hashBytes(new Uint8Array(bytes)).then(async (hash) => {
          const filename = `${hash}.${ext}`;
          const filepath = join(artifactDir, filename);
          if (existsSync(filepath)) {
            const now = new Date();
            await utimes(filepath, now, now);
          } else {
            await writeFile(filepath, bytes);
          }

          const testCaseStartedId = attachment.testCaseStartedId;
          const testStepId = attachment.testStepId;
          if (testCaseStartedId && testStepId) {
            const runEntry = runMap.get(testCaseStartedId);
            if (runEntry) {
              const stepId = runEntry.stepIdByTestStepId.get(testStepId);
              if (stepId) {
                insertArtifact(db, uuidv4(), runEntry.runId, stepId, filename);
              }
            }
          }
        }).catch(() => {});
      }
    });
  },
};
