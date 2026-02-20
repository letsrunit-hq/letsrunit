import { explore, generate, refineSuggestion, run } from '@letsrunit/executor';
import { makeFeature } from '@letsrunit/gherkin';
import { CliSink, Journal } from '@letsrunit/journal';
import { getMailbox } from '@letsrunit/mailbox';
import { asFilename, randomUUID } from '@letsrunit/utils';
import { Command } from 'commander';
import { init } from 'letsrunit';
import { readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runExplore } from './run-explore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')) as { version: string };

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

program.name('letsrunit').description('Vibe testing done right').version(version);

program
  .command('init')
  .description('Set up letsrunit in the current project')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (opts: { yes?: boolean }) => {
    await init({ yes: opts.yes });
  });

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
  .command('register')
  .argument('<target>', 'Target URL or project')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('-s, --silent', 'Only output errors', false)
  .option('-o, --save <path>', 'Path to save .feature file', '')
  .action(async (target: string, opts: { verbose: boolean; silent: boolean; save: string }) => {
    const journal = createJournal({ ...opts, artifactPath: opts.save });

    const suggestion = {
      name: 'Register a new user by email',
      description: [
        'Locate the registration form and fill it out to create a new account.',
        'Confirm the registration email and log in as the user',
      ].join('\n'),
      comments: [
        'If no registration button is visible, try locating it through the login form.',
        'The feature is complete when a confirmation email is received and verified and the user is logged in.',
      ].join('\n'),
    };

    const email = getMailbox(randomUUID());

    const { feature, status } = await generate(target, suggestion, { headless: false, journal, accounts: { email } });

    if (opts.save && feature) {
      await fs.writeFile(`${opts.save}/${asFilename(feature.name!)}.feature`, makeFeature(feature));
    }

    process.exit(status === 'passed' ? 0 : 1);
  });

program
  .command('run')
  .argument('<target>', 'Target URL or project')
  .argument('<feature>', 'Gherkin feature file')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('-s, --silent', 'Only output errors', false)
  .action(async (target: string, featureFile: string, opts: { verbose: boolean; silent: boolean }) => {
    const feature = await fs.readFile(featureFile, 'utf-8');
    await run(target, feature, { headless: false, journal: createJournal(opts) });
  });

program.parse();
