import { describe, expect, it } from 'vitest';
import { formatInitHelp, hasExplicitInitSelections, resolveInitPlanOptions, shouldShowInitHelp } from '../src/init-options.js';

describe('init option selection', () => {
  it('requires explicit selections in non-interactive mode', () => {
    expect(shouldShowInitHelp(false, {})).toBe(true);
    expect(shouldShowInitHelp(false, { withCli: true })).toBe(false);
    expect(shouldShowInitHelp(false, { agents: 'codex' })).toBe(false);
  });

  it('detects explicit init selections', () => {
    expect(hasExplicitInitSelections({})).toBe(false);
    expect(hasExplicitInitSelections({ withPlaywright: true })).toBe(true);
    expect(hasExplicitInitSelections({ agents: ['cursor'] })).toBe(true);
  });

  it('treats agent setup as an mcp install request', () => {
    expect(resolveInitPlanOptions({ agents: 'codex,cursor' })).toEqual({
      installCli: true,
      installMcp: true,
      installCucumber: false,
      installPlaywright: false,
      addGithubActions: false,
      configureAgents: true,
    });
  });

  it('treats component selections as a cli install request', () => {
    expect(resolveInitPlanOptions({ withCucumber: true })).toEqual({
      installCli: true,
      installMcp: false,
      installCucumber: true,
      installPlaywright: false,
      addGithubActions: false,
      configureAgents: false,
    });

    expect(resolveInitPlanOptions({ withGithubActions: true })).toEqual({
      installCli: true,
      installMcp: false,
      installCucumber: false,
      installPlaywright: false,
      addGithubActions: true,
      configureAgents: false,
    });
  });

  it('formats help with the explicit component flags', () => {
    const help = formatInitHelp();
    expect(help).toContain('--with-cli');
    expect(help).toContain('--with-mcp');
    expect(help).toContain('--with-cucumber');
    expect(help).toContain('--with-playwright');
    expect(help).toContain('--with-github-actions');
    expect(help).toContain('--agents <list>');
  });
});
