import { generate } from '@letsrunit/ai';
import { z } from 'zod';

const PROMPT = `Analyse the email.

* Use aria attributes (if available) for playwright selectors.
* Unsubscribe, notification settings, or generics links are NOT call-to-actions. 
* Return an empty object if the email has no OTP or CTA.`;

const ResponseSchema = z.object({
  otp: z
    .object({
      selector: z
        .string()
        .describe('Playwright selector to the OTP HTML element. Do NOT use the OTP value as part of the selector'),
      value: z
        .string()
        .describe('The OTP value'),
    })
    .optional()
    .describe('A one time password or verification code (if present)'),
  cta: z
    .object({
      selector: z
        .string()
        .describe('Playwright selector to the link. Do NOT use the `href` as part of the selector'),
    })
    .optional()
    .describe('The link of the call-to-action (if present)'),
})

export async function analyseEmail(contents: string): Promise<z.infer<typeof ResponseSchema>> {
  return await generate(PROMPT, contents, { model: 'medium', schema: ResponseSchema });
}
