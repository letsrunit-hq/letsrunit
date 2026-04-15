import { init } from './init.js';

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith('-')) ?? 'init';
const yes = args.includes('--yes') || args.includes('-y');
const noMcp = args.includes('--no-mcp');

if (command === 'init') {
  init({ yes, noMcp }).catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
} else {
  console.error(`Unknown command: ${command}`);
  console.error('Usage: letsrunit init [--yes] [--no-mcp]');
  process.exit(1);
}
