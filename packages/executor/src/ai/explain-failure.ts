import { generate } from '@letsrunit/ai';
import { z } from 'zod';

const PROMPT = `You are analyzing a failed browser test to provide useful information to the user

Classify the failure as:
- "test" when the failed step is caused by an intentional user-visible change in the application, and the product still appears to work as expected.
- "code" when the failed step is caused by broken or missing functionality, or when the user can no longer complete the expected flow.

The advise should match the classification. If the classification is to update the test, don't advise to update the code and visa-versa.
The advise must be a single concrete action to solve the failure without examples or alternatives.
`;

const ResponseSchema = z.object({
  update: z
    .enum(['test', 'code'])
    .describe('Classification: "test" if the test is outdated OR "code" if it is likely a regression'),
  reason: z
    .string()
    .describe('One short sentence describing only the observed user-visible change'),
  advice: z.string().describe('One short imperative sentence with a single action'),
});

export type ExplainFailureResponse = z.infer<typeof ResponseSchema>;

export async function explainFailure(input: string): Promise<ExplainFailureResponse> {
  return await generate(PROMPT, input, { model: 'medium', schema: ResponseSchema });
}
