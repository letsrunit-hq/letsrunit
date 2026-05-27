export const FALLBACK_SKILL = `---
name: letsrunit
description: Generate and execute browser tests using Gherkin (Given/When/Then) syntax via a real Playwright browser. Use when asked to write, run, or debug browser tests, or to automate and verify web UI behaviour.
compatibility: Requires the letsrunit MCP server to be configured.
---

Use the letsrunit MCP tools to validate browser behavior and save passing scenarios as .feature files.

Workflow:
1. Start a session with letsrunit_session_start.
2. List available steps with letsrunit_list_steps.
3. Run scenario steps with letsrunit_run.
4. Inspect state with letsrunit_snapshot and letsrunit_screenshot.
5. Close with letsrunit_session_close.
`;
