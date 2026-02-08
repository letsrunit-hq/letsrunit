'use client';

import { AlertCircle, Github } from 'lucide-react';
import { motion } from 'motion/react';

export function FailureExplanationsSection() {
  return (
    <section className="relative py-8 overflow-hidden">
      <div className="absolute inset-0 bg-black" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-column gap-4"
        >
          <div className="flex flex-column gap-3">
            <h2 className="text-4xl font-bold text-white m-0">Failure explanations</h2>

            <p className="text-xl text-300 line-height-3 m-0">
              When a test fails, we analyze the difference and explain what changed in plain language. You see exactly
              what broke and whether it's a code issue or the test needs updating.
            </p>
          </div>

          {/* Failure examples */}
          <div className="mt-8 flex flex-column gap-6">
            {/* Example 1: Update the test */}
            <div className="relative pl-6 border-left-3 border-orange-500 py-4">
              <div className="flex align-items-start gap-4">
                <div className="w-3rem h-3rem border-round bg-orange-500-alpha-10 flex align-items-center justify-content-center flex-shrink-0">
                  <AlertCircle className="w-2rem h-2rem text-orange-400" />
                </div>
                <div className="flex-1 flex flex-column gap-4">
                  <div className="text-sm text-orange-400 font-medium">Update required</div>
                  <p className="text-300 line-height-3 m-0">
                    A new checkbox labeled "I agree to the terms & conditions" has been added to the registration form.
                    This checkbox is required and must be checked before the form can be submitted.
                  </p>
                  <p className="text-orange-300 font-medium m-0">
                    Update your test to check this box before clicking "Register".
                  </p>

                  <div className="flex align-items-center gap-3 pt-2">
                    <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white border-none border-round font-medium cursor-pointer transition-colors">
                      Update Test
                    </button>
                    <button className="px-4 py-2 bg-white-alpha-10 hover:bg-white-alpha-20 border-1 border-white-alpha-10 text-white border-round font-medium cursor-pointer flex align-items-center gap-2 transition-colors">
                      <Github className="w-1rem h-1rem" />
                      Create Issue
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Example 2: Fix the code */}
            <div className="relative pl-6 border-left-3 border-red-500 py-4">
              <div className="flex align-items-start gap-4">
                <div className="w-3rem h-3rem border-round bg-red-500-alpha-10 flex align-items-center justify-content-center flex-shrink-0">
                  <AlertCircle className="w-2rem h-2rem text-red-400" />
                </div>
                <div className="flex-1 flex flex-column gap-4">
                  <div className="text-sm text-red-400 font-medium">Possible regression</div>
                  <p className="text-300 line-height-3 m-0">
                    The "Proceed to payment" button was removed from the cart page. With this button gone, there's no
                    clear way for users to continue to payment from the cart.
                  </p>
                  <p className="text-red-300 font-medium m-0">
                    This appears to be a regression. The button should be restored, or the checkout flow has
                    fundamentally changed.
                  </p>

                  <div className="flex align-items-center gap-3 pt-2">
                    <button
                      disabled
                      className="px-4 py-2 bg-white-alpha-10 text-500 border-none border-round font-medium cursor-not-allowed"
                    >
                      Update Test
                    </button>
                    <button className="px-4 py-2 bg-white-alpha-10 hover:bg-white-alpha-20 border-1 border-white-alpha-10 text-white border-round font-medium cursor-pointer flex align-items-center gap-2 transition-colors">
                      <Github className="w-1rem h-1rem" />
                      Create Issue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
