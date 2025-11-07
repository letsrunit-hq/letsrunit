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
  "purpose": "Buy and manage running gear through an online store.",
  "login_available": true,
  "actions": [
    {
      "name": "Buy running shoes",
      "description": "Select a suitable pair of running shoes, choose a size, and complete checkout with online payment.",
      "done": "The order confirmation is displayed."
    },
    {
      "name": "Compare running gear models",
      "description": "Browse the catalog, filter products by category or price, and compare multiple running gear models side by side.",
      "done": "A comparison summary is visible."
    },
    {
      "name": "Use size guide to determine shoe size",
      "description": "Open the size guide from a product page to determine the correct shoe size before purchase.",
      "done": "The size guide is displayed with sizing information."
    }
  ]
}

\`\`\`
`;

export const ActionSchema = z.object({
  name: z
    .string()
    .describe("A short name of the user action (3–8 words)"),
  description: z
    .string()
    .describe("The full (expected) user story following the initial action (10-30 words)"),
  done: z
    .string()
    .describe("A short statement describing the visible or logical end condition confirming successful completion (8–15 words)."),
});

export type Action = z.infer<typeof ActionSchema>;

export const AssessmentSchema = z.object({
  purpose: z
    .string()
    .describe("Concise sentence describing the primary purpose of a user visiting the site/app (20-50 words)"),
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
