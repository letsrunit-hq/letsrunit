'use client';

import { Tile } from '@/components/tile';
import { SiGithub } from '@icons-pack/react-simple-icons';
import { AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

export function FailureExplainSection() {
  return (
    <section className="relative py-8 overflow-hidden">
      <div className="absolute inset-0 bg-black" />

      <div className="relative z-10 container-lg mx-auto px-3 lg:px-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-column gap-4"
        >
          <div className="flex flex-column gap-3">
            <h2 className="text-4xl font-bold text-white m-0">Failure explanations</h2>

            <p className="text-lg text-500 line-height-3 m-0">
              When a test fails, we analyze the difference and explain what changed in plain language. You see exactly
              what broke and whether it's a code issue or the test needs updating.
            </p>
          </div>

          {/* Failure examples */}
          <div className="mt-8 flex flex-column gap-6">
            {/* Example 1: Update the test */}
            <Message
              severity="warn"
              content={
                <div className="flex gap-3 flex-1">
                  <Tile
                    className="hidden md:flex flex-shrink-0 mt-1 tile-orange border-none"
                    size="sm"
                    severity="warn"
                    icon={<AlertCircle size={20} className="text-orange-500" />}
                  />
                  <div className="flex flex-column gap-3 flex-1">
                    <span className="text-orange-500 font-medium text-sm">Update required</span>
                    <p className="text-500 line-height-3 m-0">
                      A new checkbox labeled "I agree to the terms & conditions" has been added to the registration
                      form. This checkbox is required and must be checked before the form can be submitted.
                    </p>
                    <p className="text-orange-300 font-medium m-0">
                      Update your test to check this box before clicking "Register".
                    </p>

                    <div className="flex align-items-center gap-3 pt-2">
                      <Button label="Update Test" size="small" />
                      <Button
                        label="Create Issue"
                        size="small"
                        icon={<SiGithub size={16} className="mr-2" />}
                        severity="secondary"
                      />
                    </div>
                  </div>
                </div>
              }
            />

            {/* Example 2: Fix the code */}
            <Message
              severity="error"
              content={
                <div className="flex gap-3 flex-1">
                  <Tile
                    className="hidden md:flex flex-shrink-0 mt-1 border-none"
                    size="sm"
                    severity="error"
                    icon={<AlertCircle size={20} className="text-red-500" />}
                  />
                  <div className="flex flex-column gap-4 flex-1">
                    <span className="text-red-500 font-medium text-sm">Possible regression</span>
                    <p className="text-500 line-height-3 m-0">
                      The "Proceed to payment" button was removed from the cart page. With this button gone, there's no
                      clear way for users to continue to payment from the cart.
                    </p>
                    <p className="text-red-300 font-medium m-0">
                      This appears to be a regression. The button should be restored, or the checkout flow has
                      fundamentally changed.
                    </p>

                    <div className="flex align-items-center gap-3 pt-2">
                      <Button label="Update Test" size="small" disabled />
                      <Button
                        label="Create Issue"
                        size="small"
                        icon={<SiGithub size={16} className="mr-2" />}
                        severity="secondary"
                      />
                    </div>
                  </div>
                </div>
              }
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
