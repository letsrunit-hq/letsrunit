import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative } from 'node:path';

const MCP_JSON_ENTRY = {
  command: './node_modules/.bin/letsrunit-mcp',
  env: {
    LETSRUNIT_MCP_RUNTIME_MODE: 'project',
  },
};

const AGENT_REPOSITORY = 'letsrunit-hq/agents';
const SKILL_DIRECTORY = 'skills/letsrunit';

interface GithubContentItem {
  type: 'dir' | 'file';
  path: string;
  url?: string;
  download_url?: string | null;
}

export interface SkillFile {
  path: string;
  content: string;
}

export type SkillFileFetcher = () => Promise<SkillFile[]>;

export function hasPath(path: string): boolean {
  return existsSync(path);
}

export function hasAnyPath(paths: string[]): boolean {
  return paths.some((path) => existsSync(path));
}

export function homePath(...parts: string[]): string {
  return join(homedir(), ...parts);
}

function sortObject(value: Record<string, unknown>): Record<string, unknown> {
  const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(entries);
}

export function ensureJsonMcpConfig(path: string): 'created' | 'updated' | 'skipped' {
  const existed = existsSync(path);
  let parsed: { mcpServers?: Record<string, unknown> } = {};
  if (existsSync(path)) {
    try {
      parsed = JSON.parse(readFileSync(path, 'utf-8')) as { mcpServers?: Record<string, unknown> };
    } catch {
      parsed = {};
    }
  }

  const current = parsed.mcpServers?.letsrunit;
  const unchanged =
    current &&
    typeof current === 'object' &&
    JSON.stringify(current) === JSON.stringify(MCP_JSON_ENTRY) &&
    parsed.mcpServers;

  if (unchanged) return 'skipped';

  const mcpServers = sortObject({ ...(parsed.mcpServers ?? {}), letsrunit: MCP_JSON_ENTRY });
  const next = { ...parsed, mcpServers };

  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, 'utf-8');
  return existed ? 'updated' : 'created';
}

function githubApiUrl(path: string): string {
  return `https://api.github.com/repos/${AGENT_REPOSITORY}/contents/${path}`;
}

async function requestText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'letsrunit-init',
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}): ${body}`);
  }
  return body;
}

async function fetchGithubDirectory(path: string): Promise<GithubContentItem[]> {
  const body = await requestText(githubApiUrl(path));
  const parsed = JSON.parse(body) as GithubContentItem[];
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected ${path} to be a directory in ${AGENT_REPOSITORY}.`);
  }
  return parsed;
}

async function fetchGithubFile(url: string): Promise<string> {
  return await requestText(url);
}

function validateSkillPath(path: string): void {
  if (path.startsWith('/') || path.split('/').includes('..')) {
    throw new Error(`Refusing to install unsafe skill path: ${path}`);
  }
}

function removeDirectoryFiles(path: string): void {
  if (!existsSync(path)) return;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const entryPath = join(path, entry.name);
    if (entry.isDirectory()) removeDirectoryFiles(entryPath);
    else rmSync(entryPath);
  }
}

function listDirectoryFiles(path: string, basePath = path): string[] {
  if (!existsSync(path)) return [];

  const files: string[] = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const entryPath = join(path, entry.name);
    if (entry.isDirectory()) {
      files.push(...listDirectoryFiles(entryPath, basePath));
    } else {
      files.push(relative(basePath, entryPath).split('\\').join('/'));
    }
  }
  return files.sort();
}

async function collectSkillFiles(path = SKILL_DIRECTORY): Promise<SkillFile[]> {
  const items = await fetchGithubDirectory(path);
  const files: SkillFile[] = [];

  for (const item of items) {
    if (item.type === 'dir') {
      files.push(...(await collectSkillFiles(item.path)));
    } else if (item.type === 'file') {
      if (!item.download_url) throw new Error(`Missing download URL for ${item.path}`);
      const relativePath = relative(SKILL_DIRECTORY, item.path);
      validateSkillPath(relativePath);
      files.push({ path: relativePath, content: await fetchGithubFile(item.download_url) });
    }
  }

  return files;
}

function skillContentMatches(destination: string, files: SkillFile[]): boolean {
  const expectedPaths = files.map((file) => file.path).sort();
  const currentPaths = listDirectoryFiles(destination);
  if (JSON.stringify(currentPaths) !== JSON.stringify(expectedPaths)) return false;

  return files.every((file) => {
    const path = join(destination, file.path);
    return existsSync(path) && readFileSync(path, 'utf-8') === file.content;
  });
}

export async function fetchLetsrunitSkillFiles(): Promise<SkillFile[]> {
  const files = await collectSkillFiles();
  if (!files.some((file) => file.path === 'SKILL.md')) {
    throw new Error(`${AGENT_REPOSITORY}/${SKILL_DIRECTORY} does not contain SKILL.md.`);
  }
  return files;
}

export async function ensureSkillDirectory(
  cwd: string,
  fetchFiles: SkillFileFetcher = fetchLetsrunitSkillFiles,
): Promise<'installed' | 'skipped'> {
  const destination = join(cwd, '.agents', 'skills', 'letsrunit');
  const files = await fetchFiles();

  if (skillContentMatches(destination, files)) return 'skipped';

  removeDirectoryFiles(destination);
  for (const file of files) {
    validateSkillPath(file.path);
    const destinationPath = join(destination, file.path);
    mkdirSync(dirname(destinationPath), { recursive: true });
    writeFileSync(destinationPath, file.content, 'utf-8');
  }

  return 'installed';
}
