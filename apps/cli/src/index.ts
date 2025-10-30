import { Command } from "commander";
import { runJob } from '@letsrunit/executor';
import type { Job } from '@letsrunit/executor';
import runTest from '@letsrunit/executor/src/run-test';

const program = new Command();

program
  .name("letsrunit")
  .description("Run tests like a vibe coder")
  .version("0.1.0");

program
  .command("run")
  .argument("<target>", "Target URL or project")
  .option("-v, --verbose", "Enable verbose logging", false)
  .action(async (target: string, opts: { verbose: boolean }) => {
    const job: Job = { target };
    const result = await runJob(job, { headless: false });

    process.exit(result.status === 'error' ? 1 : 0);
  });

program
  .command("test")
  .argument("<target>", "Target URL or project")
  .option("-v, --verbose", "Enable verbose logging", false)
  .action(async (target: string, opts: { verbose: boolean }) => {
    const job: Job = { target };
    await runTest(job, { headless: false });
  });

program.parse();
