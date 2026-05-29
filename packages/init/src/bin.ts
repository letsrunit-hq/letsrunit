import { formatInitHelp, init, shouldShowInitHelp } from './index.js';

const args = process.argv.slice(2);
const command = args[0] && !args[0].startsWith('-') ? args[0] : 'init';
const initArgs = command === 'init' && args[0] === 'init' ? args.slice(1) : args;

function hasFlag(flag: string): boolean {
  return initArgs.includes(flag);
}

function readOptionValue(name: string): string | undefined {
  const direct = initArgs.find((arg) => arg.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);

  const index = initArgs.indexOf(name);
  return index >= 0 ? initArgs[index + 1] : undefined;
}

if (command === 'init') {
  const initOptions = {
    withCli: hasFlag('--with-cli'),
    withMcp: hasFlag('--with-mcp'),
    withCucumber: hasFlag('--with-cucumber'),
    withPlaywright: hasFlag('--with-playwright'),
    withGithubActions: hasFlag('--with-github-actions'),
    agents: readOptionValue('--agents'),
  };

  if (hasFlag('--help') || hasFlag('-h') || shouldShowInitHelp(Boolean(process.stdout.isTTY && process.stdin.isTTY), initOptions)) {
    console.log(formatInitHelp());
    process.exit(0);
  }

  init(initOptions).catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
} else {
  console.error(`Unknown command: ${command}`);
  console.error(formatInitHelp());
  process.exit(1);
}
