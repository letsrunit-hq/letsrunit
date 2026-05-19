---
title: Introduction
hide_title: true
description: Stop guessing. Start testing.
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

<div style="text-align: center; font-size: 2em;">Stop guessing. Start testing.</div>

## Quick start

```bash
npx letsrunit@latest init
```

Run this in your project root. In an interactive terminal, `init` opens a prompt so you can choose what to set up. In non-interactive environments, pass explicit flags such as `--with-cucumber` or `--with-github-actions`. For all options use `--help`.

#### What `init` sets up

* Letsrunit CLI
* Cucumber wiring and support files
* `@playwright/test` and Playwright Chromium browser
* GitHub Actions workflow
* MCP server
* AI agent skill
