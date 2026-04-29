import { init } from './init.js';
import { parseAgents } from './setup/agents.js';

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith('-')) ?? 'init';
const yes = args.includes('--yes') || args.includes('-y');
const noMcp = args.includes('--no-mcp');
const agentsIndex = args.indexOf('--agents');
const agentsArg = agentsIndex >= 0 ? args[agentsIndex + 1] : undefined;

if (command === 'init') {
  init({ yes, noMcp, agents: parseAgents(agentsArg) }).catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
} else {
  console.error(`Unknown command: ${command}`);
  console.error('Usage: letsrunit init [--yes] [--no-mcp] [--agents codex,cursor]');
  process.exit(1);
}
