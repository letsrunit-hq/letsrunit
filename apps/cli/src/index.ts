import { explore, generate, refineSuggestion, runTest } from '@letsrunit/executor';
import { makeFeature } from '@letsrunit/gherkin';
import { CliSink, Journal } from '@letsrunit/journal';
import { asFilename } from '@letsrunit/utils';
import { Command } from 'commander';
import fs from 'node:fs/promises';
import { runExplore } from './run-explore';

const program = new Command();

interface JournalOptions {
  verbose: boolean;
  silent: boolean;
  artifactPath?: string;
}

function createJournal({ verbose, silent, artifactPath }: JournalOptions) {
  const verbosity = verbose ? 3 : silent ? 0 : 1;
  return new Journal(new CliSink({ verbosity, artifactPath }));
}

async function readStdin(): Promise<string> {
  return await new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');

    const isTTY = Boolean(process.stdin.isTTY);
    if (isTTY) {
      // Interactive input: allow user to type multiple lines and finish with EOF
      console.error('Enter instructions. Finish with Ctrl-D (Unix/macOS/Linux) or Ctrl-Z then Enter (Windows).');
    }

    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.resume();
  });
}

program.name('letsrunit').description('Run tests like a vibe coder').version('0.1.0');

program
  .command('explore')
  .argument('<target>', 'Target URL or project')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('-s, --silent', 'Only output errors', false)
  .option('-o, --save <path>', 'Path to save .feature file', '')
  .action(async (target: string, opts: { verbose: boolean; silent: boolean; save: string }) => {
    const journal = createJournal({ ...opts, artifactPath: opts.save });

    const { status } = await explore(target, { headless: false, journal }, async (info, actions) => {
      journal.sink.endSection();
      await runExplore(info, actions, opts.save);
    });

    process.exit(status === 'passed' ? 0 : 1);
  });

program
  .command('generate')
  .argument('<target>', 'Target URL or project')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('-s, --silent', 'Only output errors', false)
  .option('-o, --save <path>', 'Path to save .feature file', '')
  .action(async (target: string, opts: { verbose: boolean; silent: boolean; save: string }) => {
    const instructions = (await readStdin()).trim();

    if (!instructions) {
      console.error('No instructions provided');
      process.exit(1);
    }

    const journal = createJournal({ ...opts, artifactPath: opts.save });

    await journal.info('Refining test instructions');
    const suggestion = await refineSuggestion(instructions);

    const { feature, status } = await generate(target, suggestion, { headless: false, journal });

    if (opts.save && feature) {
      await fs.writeFile(`${opts.save}/${asFilename(feature.name!)}.feature`, makeFeature(feature));
    }

    process.exit(status === 'passed' ? 0 : 1);
  });

program
  .command('test')
  .argument('<target>', 'Target URL or project')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('-s, --silent', 'Only output errors', false)
  .action(async (target: string, opts: { verbose: boolean; silent: boolean }) => {
    await runTest(target, { headless: false, journal: createJournal(opts) });
  });

program.parse();
