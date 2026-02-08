'use client';

import { Tile } from '@/components/tile';
import { Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import { Panel } from 'primereact/panel';

export function TestGenerationSection() {
  const suggestions = [
    {
      title: 'Sign up for GitHub',
      description: 'Enter an email in the hero field and click "Sign up for GitHub" to create an account.',
    },
    {
      title: 'Start a free Copilot trial',
      description:
        'Click "Try Github Copilot free" to open the Copilot Pro trial flow for AI-assisted coding across supported IDEs.',
    },
    {
      title: 'Subscribe to email updates',
      description:
        'Enter your email address in the footer form and press "Subscribe" to receive product news and resources.',
    },
  ];

  return (
    <section className="relative py-8 overflow-hidden">
      <div className="relative z-10 container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-column lg:flex-row gap-6 align-items-start"
        >
          {/* Left: Content */}
          <div className="flex flex-column gap-4 flex-1">
            <h2 className="text-4xl font-bold text-white m-0">Test generation</h2>
            <div className="flex flex-column gap-4 text-xl text-300 line-height-3">
              <p className="m-0">
                We explore your page and suggest Gherkin scenarios based on what we observe. These are starting points,
                not final tests. You can review them and decide what is useful.
              </p>

              <p className="text-base text-500 m-0">
                You can generate additional scenarios later, either by re-running exploration or by giving specific
                instructions. This lets you stay in control of what gets tested and when.
              </p>

              <p className="text-base text-500 m-0">
                LetsRunIt does not auto-update tests when your UI changes. Instead, it helps you understand what failed,
                so you can choose whether the code or the test should change.
              </p>
            </div>
          </div>

          {/* Right: Suggestion Panels */}
          <div className="flex flex-column gap-3 flex-1">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Panel className="w-full even relative">
                  <div className="absolute text-blue-500 md:hidden" style={{ top: '0.75rem', right: '0.5rem' }}>
                    <Lightbulb key="icon" size={20} />
                  </div>
                  <div className="flex flex-column sm:flex-row align-items-center justify-content-between gap-3">
                    <div className="flex align-items-center gap-3">
                      <Tile className="hidden md:flex tile-blue" icon={<Lightbulb key="icon" size={24} />} />
                      <div className="flex flex-1 flex-column">
                        <div className="flex align-items-center gap-2 mb-1">
                          <h3 className="m-0 mb-1 font-normal text-white">{suggestion.title}</h3>
                        </div>
                        <p className="text-300 m-0 text-sm">{suggestion.description}</p>
                      </div>
                    </div>
                  </div>
                </Panel>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
