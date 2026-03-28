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
Scenario: User schedules a demo
  Given I'm on page "/book-demo"
  When I set field "Preferred date" to the date of 3 days from now
  And I set field "Preferred time" to "10:00"
  And I set field "Plan" to "Enterprise"
  And I click button "Continue"
  Then the page contains text "Confirm your booking"
```

Anyone on the team can read this and understand what it tests. letsrunit handles the browser automation, it resolves `field` to the right input or component, clicks the correct elements, and waits for the expected page state. Fields can be simple inputs or complex UI components. You describe the interaction, the tool handles the mechanics.

### Failure explanations

When a scenario fails, letsrunit explains what changed in plain language. Not a stack trace, but a description of what the browser actually showed versus what the test expected. That makes it straightforward to tell whether the code broke something or the test needs updating.

### Test generation

Tests are generated from either a live site or a plain-language description of what you want to check.

You can point it at a URL and it will explore the page, identify user flows, and turn those into Gherkin scenarios. This is mainly useful to get started quickly. In practice, you will often describe what you want to test yourself, for example by pasting a user story, issue, or short instruction. That input is used to generate test scenarios that reflect the intended behavior.

## With AI agents

When an AI coding agent, like Claude or Codex, implements a feature or fixes a bug, it has no way to verify whether the UI actually works. It can reason about code but it can't see the browser. letsrunit gives it one.

Through an MCP server, the agent can launch a real Chromium browser, navigate to any page, run Gherkin steps, take screenshots, and read the DOM. When a step fails, it inspects the page to understand why, adjusts its approach, and tries again. The session produces a `.feature` file that gets committed and runs in CI from that point on.

Tools like Chrome DevTools or Playwright MCP can drive a browser too, but they only tell you if something works right now. With letsrunit, the agent produces readable, repeatable tests that not only verify the behaviour now, but keep checking it in the future.

See [AI Agent Integration](ai-agents/README.md) for setup instructions.

## Why not just Playwright tests?

Playwright is a capable tool, but writing and maintaining Playwright tests is engineering work. You write TypeScript, manage selectors, handle async timing, and debug stack traces. The tests live in a separate mental model from the product.

With letsrunit, the test describes what a user does and what should happen. That's a description that can come from a product spec, a bug report, or an AI agent. It doesn't require knowing the DOM structure of the page. And when tests break, the failure message tells you what changed, not where in the code the assertion fired.

letsrunit uses Playwright internally. The difference is the layer you work at.

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
