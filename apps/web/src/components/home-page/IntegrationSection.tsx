'use client';

import { Activity, GitBranch, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { Panel } from 'primereact/panel';
import { FeatureCard } from '../feature-card';

export function IntegrationSection() {
  return (
    <section className="relative py-8 overflow-hidden">
      <div className="relative z-10 container-lg mx-auto px-3 lg:px-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-column gap-6"
        >
          {/* Execution */}
          <div className="flex flex-column gap-4">
            <h2 className="text-4xl font-bold text-white m-0">How tests run</h2>

            <div className="flex flex-column gap-4 text-lg text-500 line-height-3">
              <p className="m-0">
                Generated tests run with Cucumber. Install the package, add the step definitions we provide, and run the
                tests like any other Cucumber suite.
              </p>

              <Panel
                pt={{
                  content: { className: 'font-monospace text-sm flex flex-column gap-3' },
                }}
              >
                <div className="text-300">$ npm install @cucumber/cucumber</div>
                <div className="text-300">$ npx letsrunit init</div>
                <div className="text-orange-400">
                  $ npx cucumber-js features/ --format progress --format @letsrunit/reporter
                </div>
              </Panel>

              <p className="m-0">
                The tests integrate into existing CI without special setup. This is not a new test ecosystem. It's
                standard Gherkin running on standard tooling.
              </p>
            </div>
          </div>

          {/* Integration points */}
          <div className="flex flex-column md:flex-row gap-4">
            <FeatureCard title="Standard tooling" icon={Package}>
              Cucumber.js executes the scenarios. No custom runners or proprietary formats.
            </FeatureCard>

            <FeatureCard title="CI ready" icon={GitBranch}>
              Run in GitHub Actions, Jenkins, or any CI. The tests are files in your repo.
            </FeatureCard>

            <FeatureCard title="Run tracking" icon={Activity}>
              Test results stream to letsrunit. View test history, screenshots, and failure explanations in one place.
            </FeatureCard>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
