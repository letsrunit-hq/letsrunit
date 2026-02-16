'use client';

import { motion } from 'motion/react';
import { Panel } from 'primereact/panel';

export function GherkinSection() {
  return (
    <section className="relative py-8 overflow-hidden">
      <div className="absolute inset-0 bg-black" />

      <div className="relative z-10 container-lg mx-auto px-3 lg:px-0">
        {/* Immediate reveal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center flex flex-column gap-4"
        >
          <p className="text-xl text-500 line-height-3 m-0">
            We visit the page, explore it, and generate test scenarios written as readable steps.
          </p>
        </motion.div>

        {/* Gherkin explanation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex flex-column gap-5"
        >
          <div className="flex flex-column gap-3 mb-2">
            <h2 className="text-4xl font-bold text-white m-0 mb-2">Tests as readable steps</h2>
            <p className="text-lg text-500 line-height-3 m-0">
              Each test describes what a user does and what they expect to see. The format is called Gherkin. It reads
              like instructions, not code.
            </p>
          </div>

          {/* Example */}
          <div className="relative glow">
            <Panel
              header="login.feature"
              className="relative overflow-hidden"
              pt={{
                title: { className: 'text-xs text-400 font-monospace' },
                content: { className: 'text-500 font-monospace flex flex-column gap-2' },
              }}
            >
              <div className="text-300">Scenario: User logs in</div>
              <div className="ml-4">
                <span className="text-orange-500">When</span> I set <span className="text-blue-500">field "Email"</span>{' '}
                to <span className="text-green-500">"user@example.com"</span>
              </div>
              <div className="ml-4">
                <span className="text-orange-500">And</span> I set{' '}
                <span className="text-blue-500">field "Password"</span> to{' '}
                <span className="text-green-500">"password123"</span>
              </div>
              <div className="ml-4">
                <span className="text-orange-500">And</span> I click{' '}
                <span className="text-blue-500">button "Login"</span>
              </div>
              <div className="ml-4">
                <span className="text-orange-500">Then</span> I'm on page{' '}
                <span className="text-green-500">"/dashboard"</span>
              </div>
              <div className="ml-4">
                <span className="text-orange-500">And</span> I see that the page contains{' '}
                <span className="text-blue-500">text "Welcome"</span>
              </div>
            </Panel>
          </div>

          <p className="text-300 text-sm m-0">
            The test expresses intent. Playwright runs underneath, but the logic is clear without reading code.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
