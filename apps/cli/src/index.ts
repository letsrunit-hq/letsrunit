import { Command } from "commander";
import { Job } from 'packages/executor/src/types';
import { runJob } from '@letsrunit/executor';
import { FileCache } from '@letsrunit/core/cache';

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
    const cache = (type: string) => new FileCache(`.letsrunit/cache/${type}`);

    const result = await runJob(job, { cache });

    process.exit(result.status === 'error' ? 1 : 0);
  });

program.parse();
