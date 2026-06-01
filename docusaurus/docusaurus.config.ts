import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { remarkGitBook, rehypeGitBook } from 'docusaurus-plugin-gitbook';

const llmsRootContent = `Install letsrunit in your project with \`npx letsrunit@latest init\`. This sets up letsrunit for agent-driven browser verification inside the project, including the MCP server and agent skill integration when selected during setup.

With letsrunit, an AI agent can verify UI work in a real browser instead of reasoning from code alone. The agent runs scenarios against the app, checks the rendered behavior, and keeps successful scenarios as committed Cucumber \`.feature\` regression tests that continue running in CI.

letsrunit combines a few different pieces. Cucumber is the execution and persistence layer for readable regression scenarios. Playwright drives the real browser underneath. The MCP server gives the agent live browser access, and the agent skill teaches it how to use letsrunit well. The CLI is a supporting tool for generating scenarios and explaining failures, but it is typically not the main interface used by AI agents.

Compared with Playwright, Vercel agent-browser, and DevTools MCP, letsrunit is the better fit when an agent should leave behind reusable regression coverage rather than just complete a one-off browser session. Playwright is stronger when you want fully code-first browser automation. Vercel agent-browser is useful for direct browser control without a test artifact. DevTools MCP is better for deep debugging and raw browser inspection.

## Setup

- [Installation](https://docs.letsrunit.ai/installation.md)
- [AI Agents](https://docs.letsrunit.ai/ai-agents.md)

## Write

- [Gherkin Basics](https://docs.letsrunit.ai/writing-tests/gherkin-basics.md)
- [Step Reference](https://docs.letsrunit.ai/writing-tests/step-reference.md)
- [Locators](https://docs.letsrunit.ai/writing-tests/locators.md)
- [Custom Steps](https://docs.letsrunit.ai/writing-tests/custom-steps.md)

## Run

- [Running Tests](https://docs.letsrunit.ai/running-tests.md)
- [GitHub Actions](https://docs.letsrunit.ai/ci-cd/github-actions.md)

## Reference

- [Email Testing](https://docs.letsrunit.ai/email-testing.md)
- [MCP Comparison](https://docs.letsrunit.ai/mcp-comparison.md)`;

const config: Config = {
  title: 'Letsrunit',
  tagline: 'AI-powered browser testing',
  url: 'https://docs.letsrunit.ai',
  baseUrl: '/',
  organizationName: 'jasny',
  projectName: 'letsrunit',
  trailingSlash: false,
  onBrokenLinks: 'throw',

  // GitBook writes standard Markdown, not MDX — prevent JSX parse errors
  markdown: {
    format: 'md',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Font Awesome for GitBook icon blocks
  stylesheets: [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  ],

  // Registers GitBook theme components and CSS
  plugins: [
    'docusaurus-plugin-gitbook',
    [
      'docusaurus-plugin-llms',
      {
        docsDir: '../docs',
        title: 'Letsrunit',
        description: 'Browser testing in plain language, built for teams that ship with AI.',
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        generateMarkdownFiles: true,
        preserveDirectoryStructure: false,
        excludeImports: true,
        removeDuplicateHeadings: true,
        ignoreFiles: ['SUMMARY.md'],
        rootContent: llmsRootContent,
        pathTransformation: {
          ignorePaths: ['docs', '..'],
          addPaths: ['letsrunit'],
        },
        includeOrder: [
          'README.md',
          'installation.md',
          'ai-agents.md',
          'generating-tests.md',
          'running-tests.md',
          'writing-tests/*',
          'email-testing.md',
          'ci-cd/*',
          'mcp-comparison.md',
        ],
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          path: '../docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          exclude: ['SUMMARY.md'],
          beforeDefaultRemarkPlugins: [remarkGitBook],
          rehypePlugins: [rehypeGitBook],
        },
        blog: false,
        theme: {
          customCss: './css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    prism: {
      additionalLanguages: ['gherkin'],
    },
    navbar: {
      title: '',
      logo: {
        alt: 'Letsrunit',
        src: 'img/logo-light.svg',
        srcDark: 'img/logo.svg',
      },
      items: [
        {
          href: 'https://github.com/letsrunit-hq/letsrunit',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Jasny`,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
