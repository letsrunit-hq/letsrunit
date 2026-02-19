import { init } from './init.js';

const [command] = process.argv.slice(2);

if (command === 'init' || command === undefined) {
  init().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
} else {
  console.error(`Unknown command: ${command}`);
  console.error('Usage: letsrunit init');
  process.exit(1);
}
