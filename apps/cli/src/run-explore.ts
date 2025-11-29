import type { Action, AppInfo } from '@letsrunit/executor';
import { makeFeature } from '@letsrunit/gherkin';
import { asFilename } from '@letsrunit/utils';
import * as fs from 'node:fs/promises';

function disableEcho() {
  process.stdout.write('\x1B[?25l'); // hide cursor (optional)
  process.stdout.write('\x1B[8m'); // hide input
}

function enableEcho() {
  process.stdout.write('\x1B[0m');
  process.stdout.write('\x1B[?25h');
}

function readKey(): Promise<string> {
  const { stdin } = process;

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  disableEcho();

  return new Promise<string>((resolve) => {
    const handler = (pressed: string) => {
      stdin.removeListener('data', handler);
      stdin.setRawMode(false);
      stdin.pause();
      enableEcho();

      resolve(pressed);
    };

    stdin.on('data', handler);
  });
}

async function readOption(limit: number): Promise<number> {
  while (true) {
    const key = await readKey();
    if (key === '\u0003') return -1;

    const opt = key >= '0' && key <= '9' ? Number(key) : null;

    if (!opt || opt > limit) {
      process.stdout.write('\x1b[33mInvalid option selected\x1b[0m\n');
      continue;
    }

    return opt - 1;
  }
}

export async function runExplore(info: AppInfo, actions: Action[], storagePath?: string) {
  const { stdout } = process;

  while (actions.length > 0) {
    stdout.write(`\n\x1b[1m${info.title}\x1b[0m\n`);
    stdout.write('What do you want to test? Choose one of the following options:\n');

    let count = 1;
    for (const action of actions) {
      stdout.write(`${count++}. ${action.name}\n`);
    }

    const opt = await readOption(actions.length);
    if (opt < 0) return;

    stdout.write('\n');
    const { status, feature } = await actions[opt].run();

    actions.splice(opt, 1);

    if (storagePath && status === 'passed' && feature) {
      await fs.writeFile(`${storagePath}/${asFilename(feature.name!)}.feature`, makeFeature(feature));
    }
  }
}
