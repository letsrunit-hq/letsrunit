import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type DetectionConfidence = 'high' | 'medium' | 'low';

export interface DetectionResult<T> {
  value: T;
  confidence: DetectionConfidence;
  evidence: string[];
}

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface AppTarget {
  framework: string;
  port: number;
  baseUrl: string;
}

interface FrameworkMatch {
  name: string;
  defaultPort: number;
  confidence: DetectionConfidence;
  evidence: string[];
}

const DEFAULT_PORT = 3000;

const FRAMEWORK_RULES: Array<{ name: string; defaultPort: number; deps: string[]; scriptPatterns?: RegExp[] }> = [
  { name: 'nextjs', defaultPort: 3000, deps: ['next'], scriptPatterns: [/\bnext\s+(?:dev|start)\b/] },
  { name: 'vite', defaultPort: 5173, deps: ['vite', '@vitejs/plugin-react', '@vitejs/plugin-vue'], scriptPatterns: [/\bvite\b/] },
  { name: 'angular', defaultPort: 4200, deps: ['@angular/core', '@angular/cli'], scriptPatterns: [/\bng\s+(?:serve|dev)\b/] },
  { name: 'nuxt', defaultPort: 3000, deps: ['nuxt'], scriptPatterns: [/\bnuxt\s+(?:dev|start)\b/] },
  { name: 'sveltekit', defaultPort: 5173, deps: ['@sveltejs/kit'] },
  { name: 'astro', defaultPort: 4321, deps: ['astro'], scriptPatterns: [/\bastro\s+dev\b/] },
  { name: 'vue-cli', defaultPort: 8080, deps: ['@vue/cli-service'] },
  { name: 'create-react-app', defaultPort: 3000, deps: ['react-scripts'] },
  { name: 'remix', defaultPort: 5173, deps: ['@remix-run/dev'], scriptPatterns: [/\bremix\s+vite:dev\b/] },
  { name: 'nestjs', defaultPort: 3000, deps: ['@nestjs/core'] },
];

function readText(path: string): string {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return '';
  }
}

function readPackageJson(cwd: string): PackageJson {
  const path = join(cwd, 'package.json');
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readText(path)) as PackageJson;
  } catch {
    return {};
  }
}

function parsePortFromEnvText(text: string): number | null {
  const match = text.match(/(?:^|\n)\s*(?:PORT|APP_PORT)\s*=\s*['"]?(\d{2,5})['"]?\s*(?:\n|$)/);
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

function parsePortFromScript(script: string): number | null {
  const envMatch = script.match(/(?:^|\s)PORT\s*=\s*(\d{2,5})(?:\s|$)/);
  if (envMatch) return Number.parseInt(envMatch[1], 10);

  const longFlag = script.match(/--port(?:=|\s+)(\d{2,5})(?:\s|$)/);
  if (longFlag) return Number.parseInt(longFlag[1], 10);

  const shortFlag = script.match(/(?:^|\s)-p\s+(\d{2,5})(?:\s|$)/);
  if (shortFlag) return Number.parseInt(shortFlag[1], 10);

  return null;
}

function detectFramework(pkg: PackageJson): FrameworkMatch | null {
  const deps = pkg.dependencies ?? {};
  const devDeps = pkg.devDependencies ?? {};
  const scripts = pkg.scripts ?? {};

  for (const fw of FRAMEWORK_RULES) {
    const depMatch = fw.deps.find((dep) => dep in deps || dep in devDeps);
    if (depMatch) {
      return { name: fw.name, defaultPort: fw.defaultPort, confidence: 'high', evidence: [`dependency:${depMatch}`] };
    }
  }

  for (const fw of FRAMEWORK_RULES) {
    if (!fw.scriptPatterns) continue;
    for (const [name, body] of Object.entries(scripts)) {
      if (fw.scriptPatterns.some((pattern) => pattern.test(body))) {
        return { name: fw.name, defaultPort: fw.defaultPort, confidence: 'medium', evidence: [`script:${name}`] };
      }
    }
  }

  return null;
}

function extractPortByRegex(text: string, regex: RegExp): number | null {
  const match = text.match(regex);
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

function detectPortFromViteConfig(cwd: string): DetectionResult<number> | null {
  const files = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs', 'vite.config.cts', 'vite.config.cjs'];
  for (const file of files) {
    const path = join(cwd, file);
    if (!existsSync(path)) continue;
    const text = readText(path);
    const port = extractPortByRegex(text, /server\s*:\s*\{[\s\S]*?port\s*:\s*(\d{2,5})/m);
    if (port) {
      return { value: port, confidence: 'high', evidence: [file] };
    }
  }

  return null;
}

function detectPortFromAngularConfig(cwd: string): DetectionResult<number> | null {
  const files = ['angular.json', 'workspace.json'];
  for (const file of files) {
    const path = join(cwd, file);
    if (!existsSync(path)) continue;

    try {
      const config = JSON.parse(readText(path)) as {
        defaultProject?: string;
        projects?: Record<string, any>;
      };
      const projects = config.projects ?? {};
      const names = [config.defaultProject, ...Object.keys(projects)].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i) as string[];

      for (const name of names) {
        const project = projects[name] as any;
        const architect = project?.architect ?? project?.targets;
        const serve = architect?.serve;
        const port = serve?.options?.port;
        if (Number.isFinite(port)) {
          return { value: Number(port), confidence: 'high', evidence: [`${file}#projects.${name}.architect.serve.options.port`] };
        }

        const configurations = serve?.configurations ?? {};
        for (const [configName, cfg] of Object.entries(configurations)) {
          const candidate = (cfg as any)?.port;
          if (Number.isFinite(candidate)) {
            return {
              value: Number(candidate),
              confidence: 'medium',
              evidence: [`${file}#projects.${name}.architect.serve.configurations.${configName}.port`],
            };
          }
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

function detectPortFromNuxtConfig(cwd: string): DetectionResult<number> | null {
  const files = ['nuxt.config.ts', 'nuxt.config.js', 'nuxt.config.mjs', 'nuxt.config.cjs'];
  for (const file of files) {
    const path = join(cwd, file);
    if (!existsSync(path)) continue;

    const text = readText(path);
    const devServerPort = extractPortByRegex(text, /devServer\s*:\s*\{[\s\S]*?port\s*:\s*(\d{2,5})/m);
    if (devServerPort) return { value: devServerPort, confidence: 'high', evidence: [file] };

    const serverPort = extractPortByRegex(text, /server\s*:\s*\{[\s\S]*?port\s*:\s*(\d{2,5})/m);
    if (serverPort) return { value: serverPort, confidence: 'high', evidence: [file] };
  }

  return null;
}

function detectPortFromAstroConfig(cwd: string): DetectionResult<number> | null {
  const files = ['astro.config.ts', 'astro.config.mjs', 'astro.config.js', 'astro.config.cjs'];
  for (const file of files) {
    const path = join(cwd, file);
    if (!existsSync(path)) continue;
    const text = readText(path);
    const port = extractPortByRegex(text, /server\s*:\s*\{[\s\S]*?port\s*:\s*(\d{2,5})/m);
    if (port) return { value: port, confidence: 'high', evidence: [file] };
  }

  return null;
}

function detectPortFromVueCliConfig(cwd: string): DetectionResult<number> | null {
  const path = join(cwd, 'vue.config.js');
  if (!existsSync(path)) return null;

  const text = readText(path);
  const port = extractPortByRegex(text, /devServer\s*:\s*\{[\s\S]*?port\s*:\s*(\d{2,5})/m);
  if (!port) return null;
  return { value: port, confidence: 'high', evidence: ['vue.config.js'] };
}

function detectPortFromFrameworkConfig(cwd: string, framework: string): DetectionResult<number> | null {
  if (framework === 'vite' || framework === 'sveltekit' || framework === 'remix') return detectPortFromViteConfig(cwd);
  if (framework === 'angular') return detectPortFromAngularConfig(cwd);
  if (framework === 'nuxt') return detectPortFromNuxtConfig(cwd);
  if (framework === 'astro') return detectPortFromAstroConfig(cwd);
  if (framework === 'vue-cli') return detectPortFromVueCliConfig(cwd);
  return null;
}

function detectPortFromScripts(pkg: PackageJson): DetectionResult<number> | null {
  const scripts = pkg.scripts ?? {};
  const orderedScripts = ['start:ci', 'start', 'dev', 'serve', 'preview'];

  for (const name of orderedScripts) {
    const body = scripts[name];
    if (!body) continue;
    const port = parsePortFromScript(body);
    if (port) {
      return { value: port, confidence: 'high', evidence: [`package.json#scripts.${name}`] };
    }
  }

  return null;
}

function detectPortFromEnvFiles(cwd: string): DetectionResult<number> | null {
  const envFiles = ['.env', '.env.local', '.env.development', '.env.test', '.env.ci'];
  for (const file of envFiles) {
    const path = join(cwd, file);
    if (!existsSync(path)) continue;
    const port = parsePortFromEnvText(readText(path));
    if (port) return { value: port, confidence: 'medium', evidence: [file] };
  }

  return null;
}

function buildTarget(framework: string, port: DetectionResult<number>): DetectionResult<AppTarget> {
  return {
    value: {
      framework,
      port: port.value,
      baseUrl: `http://localhost:${port.value}`,
    },
    confidence: port.confidence,
    evidence: port.evidence,
  };
}

export function detectAppTarget(cwd: string): DetectionResult<AppTarget> {
  const pkg = readPackageJson(cwd);
  const frameworkMatch = detectFramework(pkg);
  const framework = frameworkMatch?.name ?? 'unknown';

  const scriptPort = detectPortFromScripts(pkg);
  if (scriptPort) return buildTarget(framework, scriptPort);

  const configPort = detectPortFromFrameworkConfig(cwd, framework);
  if (configPort) return buildTarget(framework, configPort);

  const envPort = detectPortFromEnvFiles(cwd);
  if (envPort) return buildTarget(framework, envPort);

  if (frameworkMatch) {
    return buildTarget(framework, {
      value: frameworkMatch.defaultPort,
      confidence: frameworkMatch.confidence,
      evidence: [...frameworkMatch.evidence, 'framework default'],
    });
  }

  return buildTarget('unknown', { value: DEFAULT_PORT, confidence: 'low', evidence: ['default fallback'] });
}
