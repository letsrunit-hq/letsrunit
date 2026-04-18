import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { remarkGitBook, rehypeGitBook } from 'docusaurus-plugin-gitbook';

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
        excludeImports: true,
        removeDuplicateHeadings: true,
        ignoreFiles: ['SUMMARY.md'],
        pathTransformation: {
          ignorePaths: ['docs', '..'],
          addPaths: ['letsrunit'],
        },
        includeOrder: [
          'README.md',
          'generating-tests.md',
          'running-tests.md',
          'writing-tests/*',
          'ai-agents/README.md',
          'ci-cd/*',
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
      title: 'Letsrunit',
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
      copyright: `Copyright © ${new Date().getFullYear()} letsrunit-hq`,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
