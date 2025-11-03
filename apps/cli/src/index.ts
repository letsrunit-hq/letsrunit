import { Command } from "commander";
import { runJob } from '@letsrunit/executor';
import type { Job } from '@letsrunit/executor';
import runTest from '@letsrunit/executor/src/run-test';
import { CliSink, Journal } from '@letsrunit/journal';

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
  .command("run")
  .argument("<target>", "Target URL or project")
  .option("-v, --verbose", "Enable verbose logging", false)
  .option("-s, --silent", "Only output errors", false)
  .action(async (target: string, opts: { verbose: boolean, silent: boolean }) => {
    const job: Job = { target };
    const result = await runJob(job, { headless: false, journal: createJournal(opts) });

    process.exit(result.status === 'error' ? 1 : 0);
  });

program
  .command("test")
  .argument("<target>", "Target URL or project")
  .option("-v, --verbose", "Enable verbose logging", false)
  .option("-s, --silent", "Only output errors", false)
  .action(async (target: string, opts: { verbose: boolean, silent: boolean }) => {
    const job: Job = { target };
    await runTest(job, { headless: false, journal: createJournal(opts) });
  });

program.parse();
