import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'README',
    'ai-agents',
    'generating-tests',
    {
      type: 'category',
      label: 'Writing Tests',
      items: [
        'writing-tests/gherkin-basics',
        'writing-tests/step-reference',
        'writing-tests/locators',
        'writing-tests/custom-steps',
      ],
    },
    'running-tests',
    'email-testing',
    {
      type: 'category',
      label: 'CI/CD',
      items: ['ci-cd/github-actions'],
    },
    'mcp-comparison',
  ],
};

export default sidebars;
