import { generate } from '@letsrunit/ai';
import { z } from 'zod';

const PROMPT = `You are analyzing a failed browser test.

Given:
1) The scenario with per-step status symbols:
- ✓ = step succeeded
- ✘ = failed step
- ○ = unprocessed step
2) The failure message
3) A unified HTML diff between the baseline (last successful run) and the failed run for the failed step

Classify the failure as one of:
- "test": update required in the test
- "code": likely product regression

Use this style:

Update required
A new checkbox labeled "I agree to the terms & conditions" has been added to the registration form. This checkbox is required and must be checked before the form can be submitted.

Update your test to check this box before clicking "Register".

---

Possible regression
The "Proceed to payment" button was removed from the cart page. With this button gone, there's no clear way for users to continue to payment from the cart.

This appears to be a regression. The button should be restored, or the checkout flow has fundamentally changed.

Focus on user-visible behavior. Be precise and short.
`;

const ResponseSchema = z.object({
  update: z.enum(['test', 'code']),
  reason: z.string(),
  advice: z.string(),
});

export type ExplainFailureResponse = z.infer<typeof ResponseSchema>;

export async function explainFailure(input: string): Promise<ExplainFailureResponse> {
  return await generate(PROMPT, input, { model: 'medium', schema: ResponseSchema });
}
