import { Command } from "commander";
import { Job } from '@letsrunit/core/types';
import { runJob } from '@letsrunit/executor';

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

    await runJob(job);
  });

program.parse();
