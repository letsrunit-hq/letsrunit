import { execSync } from 'node:child_process';

export function resolveAllowedCommits(): string[] | undefined {
  try {
    const output = execSync('git log --format=%H', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return undefined;
  }
}
