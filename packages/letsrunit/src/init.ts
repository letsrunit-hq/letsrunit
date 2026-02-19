import { intro, log, note, outro, spinner } from '@clack/prompts';
import { detectEnvironment } from './detect.js';
import { installCli } from './setup/cli.js';
import { setupCucumber } from './setup/cucumber.js';

const BDD_IMPORT = '@letsrunit/bdd/define';

export async function init(): Promise<void> {
  intro('letsrunit init');

  const env = detectEnvironment();

  const s = spinner();
  s.start('Installing @letsrunit/cli…');
  const cliResult = installCli(env.packageManager, env.cwd);
  if (cliResult.skipped) {
    s.stop('@letsrunit/cli already installed');
  } else {
    s.stop('@letsrunit/cli installed');
  }

  if (env.hasCucumber) {
    const result = setupCucumber(env.packageManager, env.cwd);

    if (result.bddInstalled) {
      log.success('@letsrunit/bdd installed');
    }

    if (result.configResult === 'created') {
      log.success('cucumber.js created');
    } else if (result.configResult === 'needs-manual-update') {
      log.warn('cucumber.js exists but does not import @letsrunit/bdd.');
      note(`Add '${BDD_IMPORT}' to your imports array in cucumber.js`, 'Action required');
    }

    if (result.featuresCreated) {
      log.success('features/ directory created with example.feature');
    }
  } else {
    log.warn('@cucumber/cucumber not found. Install it to use letsrunit with Cucumber:');
    note('npm install --save-dev @cucumber/cucumber\nThen run: npx letsrunit init', 'Setup Cucumber');
  }

  outro('All done! Run npx letsrunit --help to get started.');
}
