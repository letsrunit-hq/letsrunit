import * as z from "zod";
import { generate } from '@letsrunit/ai';

const PROMPT = `You are exploring a website or webapp **for the very first time** — with **no account**, **no cookies**, and **no prior knowledge** of what it does.

Your task is to **understand the purpose** of the site and list what a **new visitor can do** based only on visible content and metadata.

---

## Inputs

* YAML front matter with optional fields such as title, description, canonical URL, and language.
* \`{contentType}\`: main visible page content.

You must rely **strictly** on these inputs.
Do **not invent** features, flows, or pages that aren’t clearly present or implied.

---

## Actions to Perform

Extract the following:

1. **Purpose**

   * A concise sentence describing the core purpose of the site or web app.
   * Use plain, natural language — no slogans, no fluff.
   * Example: \`"Buy and manage running gear through an online store."\`

2. **Login Availability**

   * Return \`true\` if elements like *Sign in*, *Log in*, *Sign up*, *Create account*, or OAuth buttons are found.
   * Otherwise, return \`false\`.

3. **Actions (1 to 5)**

   * List concrete, **user-completable** actions that a new visitor can take **without logging in**.
   * Each action must have:

     * \`name\`: A short, verb-led action (e.g., \`"Create a newborn visit page"\`).
     * \`description\`: A **specific**, **realistic** scenario that can be completed without login.
     * \`done\`: A statement describing when the task is considered complete by the user.

---

## Writing Rules

✓ Use **direct verbs**:
  • "Create a page"
  • "Buy a product"
  • "Compare items"
  • "Book an appointment"
✘ **Do NOT** use weak, vague verbs like:
  • "Start creating..."
  • "Learn more"
  • "Get started"
  • "Access features"

✓ Actions must be **clearly described** and **user-completable**
✘ Do NOT pad with vague or incomplete flows like "Start exploring"
✘ Do NOT include static reading as an action (e.g., reading About pages)
✘ Do NOT infer features based on UI labels unless clearly described

✓ Respect the maximum of 5 actions — **not approximate**
✘ Do NOT add filler actions to reach 5 — return only valid actions

✓ **All outputs must be in English**, regardless of site language

✓ NEVER include:
  • Cookie banners
  • Privacy policies
  • Legal links
  • External link actions

---

### Example Output

\`\`\`json
{
  "purpose": "Create and share visit schedules for newborns.",
  "login_available": true,
  "actions": [
    {
      "name": "Create a newborn visit page",
      "description": "Set up a personalized visit page and generate a unique shareable link for guests to book time slots.",
      "done": "The page is created and the link is visible to the user."
    },
    {
      "name": "Preview the visit schedule",
      "description": "View the visit schedule as it appears to guests, including booked and available time slots.",
      "done": "The preview page is shown."
    }
  ]
}
\`\`\`
`;

export const ActionSchema = z.object({
  name: z
    .string()
    .describe("A short name of the user action (8–15 words)"),
  description: z
    .string()
    .describe("The full (expected) user story following the initial action (10-40 words)"),
  done: z
    .string()
    .describe('"The scenario is done when ..." (10-20 words)'),
});

export type Action = z.infer<typeof ActionSchema>;

export const AssessmentSchema = z.object({
  purpose: z
    .string()
    .describe("Concise sentence describing the primary purpose of a user visiting the site/app (25-50 words)"),
  loginAvailable: z
    .boolean()
    .describe("True if login or sign-up is visible on the page; otherwise false."),
  actions: z
    .array(
      ActionSchema.describe("A specific user action that can can be started from the page."),
    )
    .min(1, "At least 1 action required")
    .max(5, "No more than 5 actions allowed")
    .describe("List of 1-5 main things a first-time visitor can do without logging in."),
});

export type Assessment = z.infer<typeof AssessmentSchema>;

export async function assessPage(page: string): Promise<Assessment> {
  const isHtml = page.trim().startsWith('<');
  const contentType = isHtml ?
    'A scrubbed HTML body' :
    'Markdown version of the HTML page, annotated with Playwright-style locator hints.';

  const prompt = PROMPT.replace('{contentType}', contentType);

  return await generate(prompt, page, { schema: AssessmentSchema, model: 'large', reasoningEffort: 'medium' });
}
