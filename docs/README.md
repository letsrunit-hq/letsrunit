---
title: Introduction
hide_title: true
description: Browser testing in plain language, built for teams that ship with AI.
cover:
  dark: .gitbook/assets/logo.svg
  light: .gitbook/assets/logo-light.svg
layout:
  width: wide
  tableOfContents:
    visible: false
  outline:
    visible: false
  pagination:
    visible: false
---

letsrunit is a browser testing tool that describes what your app should do in plain language rather than code. Tests are written in Gherkin, run by Cucumber.js, and integrate into any CI pipeline as standard files. You can write them by hand, generate them from a live URL, or let your AI coding agent produce them as part of its normal workflow.

## Browser testing in plain language

Most browser testing tools require you to write automation code: find an element by selector, call `.click()`, assert on the DOM. That code works, but it's opaque. A non-engineer can't read it, a code review tells you little about intent, and when something breaks you get a stack trace.

letsrunit tests read as behaviour descriptions:

```gherkin
Scenario: User resets their password
  Given I'm on page "/login"
  When I click link "Forgot password"
  And I set field "Email" to "admin@example.com"
  And I click button "Send reset link"
  Then the page contains text "Check your inbox"
  And I received an email sent to "admin@example.com" with subject "Reset your your password"
```

Anyone on the team can read that and understand what it's testing. letsrunit handles all the underlying browser automation: it resolves `field "Email"` to the right input, clicks the right button, and waits for the right page state. You describe the interaction; the tool handles the mechanics.

### Failure explanations

When a scenario fails, letsrunit explains what changed in plain language. Not a stack trace, but a description of what the browser actually showed versus what the test expected. That makes it straightforward to tell whether the code broke something or the test needs updating.

### Test generation

The `explore` command generates scenarios from a live URL. Point it at a page and it discovers testable user stories, generates Gherkin scenarios, runs them, and saves the passing ones as `.feature` files ready to commit.

## With AI agents

When an AI coding agent, like Claude or Codex, implements a feature or fixes a bug, it has no way to verify whether the UI actually works. It can reason about code but it can't see the browser. letsrunit gives it one.

Through an MCP server, the agent can launch a real Chromium browser, navigate to any page, run Gherkin steps, take screenshots, and read the DOM. When a step fails, it inspects the page to understand why, adjusts its approach, and tries again. The session produces a `.feature` file that gets committed and runs in CI from that point on.

This changes how agents finish tasks. Fixing a bug isn't done until the fix has been verified in the browser. Adding a feature isn't done until the flow works end to end. The tests that come out of those sessions aren't an afterthought. They're what the agent produces to prove the work is complete.

See [AI Agent Integration](ai-agents/README.md) for setup instructions.

## Why not just Playwright tests?

Playwright is a capable tool, but writing and maintaining Playwright tests is engineering work. You write TypeScript, manage selectors, handle async timing, and debug stack traces. The tests live in a separate mental model from the product.

With letsrunit, the test describes what a user does and what should happen. That's a description that can come from a product spec, a bug report, or an AI agent. It doesn't require knowing the DOM structure of the page. It doesn't require understanding Playwright's API. And when it breaks, the failure message tells you what changed, not where in the code the assertion fired.

Playwright runs the browser under the hood. letsrunit uses Playwright internally. The difference is the layer you work at.

## Get started

<table data-view="cards">
  <thead>
    <tr>
      <th>Title</th>
      <th data-card-target data-type="content-ref">Target</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Installation</td>
      <td><a href="installation">Installation</a></td>
    </tr>
    <tr>
      <td>AI Agent Integration</td>
      <td><a href="ai-agents">AI Agents</a></td>
    </tr>
    <tr>
      <td>Generating Tests</td>
      <td><a href="generating-tests">Generating Tests</a></td>
    </tr>
    <tr>
      <td>Running Tests</td>
      <td><a href="running-tests">Running Tests</a></td>
    </tr>
  </tbody>
</table>
