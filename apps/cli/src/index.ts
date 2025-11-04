import { Command } from "commander";
import { explore } from '@letsrunit/executor';
import runTest from '@letsrunit/executor/src/run-test';
import { CliSink, Journal } from '@letsrunit/journal';
import { runExplore } from './run-explore';

const program = new Command();

function createJournal({ verbose, silent }: { verbose: boolean, silent: boolean }) {
  const verbosity = verbose ? 3 : silent ? 0 : 1;
  return new Journal(new CliSink({ verbosity }));
}

program
  .name("letsrunit")
  .description("Run tests like a vibe coder")
  .version("0.1.0");

program
  .command("explore")
  .argument("<target>", "Target URL or project")
  .option("-v, --verbose", "Enable verbose logging", false)
  .option("-s, --silent", "Only output errors", false)
  .action(async (target: string, opts: { verbose: boolean, silent: boolean }) => {
    const journal = createJournal(opts);

    const result = await explore(
      target,
      { headless: false, journal },
      async (...args) => {
        journal.sink.endSection();
        await runExplore(...args);
      }
    );

    process.exit(result.status === 'error' ? 1 : 0);
  });

program
  .command("test")
  .argument("<target>", "Target URL or project")
  .option("-v, --verbose", "Enable verbose logging", false)
  .option("-s, --silent", "Only output errors", false)
  .action(async (target: string, opts: { verbose: boolean, silent: boolean }) => {
    await runTest(target, { headless: false, journal: createJournal(opts) });
  });

program.parse();
