import { confirm, intro, log, note, outro, spinner } from '@clack/prompts';
import { detectEnvironment } from './detect.js';
import { installCli } from './setup/cli.js';
import { installCucumber, setupCucumber } from './setup/cucumber.js';
import { installGithubAction } from './setup/github-actions.js';

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

  let hasCucumber = env.hasCucumber;

  if (!hasCucumber) {
    if (env.isInteractive) {
      const install = await confirm({ message: '@cucumber/cucumber not found. Install it now?' });
      if (install === true) {
        const s2 = spinner();
        s2.start('Installing @cucumber/cucumber…');
        installCucumber(env.packageManager, env.cwd);
        s2.stop('@cucumber/cucumber installed');
        hasCucumber = true;
      }
    } else {
      log.warn('@cucumber/cucumber not found. Install it to use letsrunit with Cucumber:');
      note('npm install --save-dev @cucumber/cucumber\nThen run: npx letsrunit init', 'Setup Cucumber');
    }
  }

  if (hasCucumber) {
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

    if (env.isInteractive) {
      const addAction = await confirm({ message: 'Add a GitHub Action to run features on push?' });
      if (addAction === true) {
        const actionResult = installGithubAction(env.packageManager, env.cwd);
        if (actionResult === 'created') {
          log.success('.github/workflows/letsrunit.yml created');
        } else {
          log.info('.github/workflows/letsrunit.yml already exists, skipped');
        }
      }
    }
  }

  outro('All done! Run npx letsrunit --help to get started.');
}
