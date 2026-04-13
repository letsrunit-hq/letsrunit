export type DebugWorldParametersInput = {
  argv?: string[];
  baseWorldParameters?: Record<string, unknown>;
  defaultHeadless?: boolean;
};

type JsonObject = Record<string, unknown>;

const BUILTIN_AGENT_ENV_VAR_KEYS = ['CODEX_CI', 'CLAUDECODE', 'GEMINI_CLI', 'CURSOR_AGENT'] as const;

function parseJsonObject(raw: string | undefined): JsonObject {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as JsonObject;
    }
  } catch {}

  return {};
}

export function readCliWorldParameters(argv: string[]): JsonObject {
  const inlineArg = argv.find((arg) => arg.startsWith('--world-parameters='));
  if (inlineArg) return parseJsonObject(inlineArg.slice('--world-parameters='.length));

  const index = argv.findIndex((arg) => arg === '--world-parameters' || arg === '-w');
  if (index < 0) return {};

  return parseJsonObject(argv[index + 1]);
}

function isEnabledEnvVar(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return normalized !== '0' && normalized !== 'false';
}

export function isAgentEnvironment(
  env: Record<string, string | undefined> = process.env,
  extraEnvVarKeys: string[] = [],
): boolean {
  const keys = [...BUILTIN_AGENT_ENV_VAR_KEYS, ...extraEnvVarKeys];
  return keys.some((key) => isEnabledEnvVar(env[key]));
}

export function resolveDebugWorldParameters(input: DebugWorldParametersInput = {}): {
  failFast: boolean;
  headless: boolean;
  worldParameters: JsonObject;
} {
  const argv = input.argv ?? process.argv;
  const fromCli = readCliWorldParameters(argv);
  const base = input.baseWorldParameters ?? {};
  const defaultHeadless = input.defaultHeadless ?? true;

  const merged = { ...base, ...fromCli };
  const headless = typeof merged.headless === 'boolean' ? merged.headless : defaultHeadless;
  const failFast = argv.includes('--fail-fast');

  return {
    failFast,
    headless,
    worldParameters: {
      ...merged,
      headless,
      skipCloseOnFailure: failFast && !headless,
    },
  };
}
