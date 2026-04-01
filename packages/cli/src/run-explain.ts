import { explain as explainRun, type ExplainResult } from '@letsrunit/executor';

export async function runExplain(opts: { db?: string; artifacts?: string }) {
  const result: ExplainResult = await explainRun({ dbPath: opts.db, artifactsDir: opts.artifacts });

  const { stdout, stderr } = process;

  if (!result.hasRun) {
    stderr.write('No letsrunit run found.\n');
    process.exit(1);
  }

  if (result.totalFailed === 0) {
    stdout.write('No failures in latest run; nothing to explain.\n');
    process.exit(0);
  }

  for (const item of result.explanations) {
    stdout.write(`\n\x1b[1m${item.featurePath} :: ${item.scenarioName}\x1b[0m\n`);
    stdout.write(`${item.steps}\n\n`);
    stdout.write(`\x1b[1m${item.updateMessage}\x1b[0m\n`);
    stdout.write(`${item.reason}\n`);
    stdout.write(`💡 ${item.advice}\n`);
  }

  for (const err of result.errors) {
    stderr.write(`\n\x1b[31m${err.featurePath} :: ${err.scenarioName}\x1b[0m\n`);
    stderr.write(`Error: ${err.error}\n`);
  }

  process.exit(result.errors.length > 0 ? 1 : 0);
}
