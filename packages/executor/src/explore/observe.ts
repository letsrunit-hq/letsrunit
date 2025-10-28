import * as z from "zod";
import { generate } from '@letsrunit/ai';

const PROMPT = `You are exploring a website or webapp **for the very first time**.
You have **no account**, **no cookies**, and **no prior knowledge** of what it does.
Your task is to **understand the site’s purpose** and **list what a new visitor can do** based solely on the page content and metadata.

## Inputs

* YAML front matter containing optional info such as title, description, canonical URL and language.
* {contentType}

You must rely **only** on what is visible in these inputs.
Do **not invent** pages, features, or actions that aren’t clearly present or implied.

## actions

From these inputs, extract the following:

1. **Purpose** — What is the primary purpose of a user visiting this website/webapp?
   * Present a concise, plain-English sentence
   * Use natural language, not marketing slogans.
   * Max 50 words.

2. **Login Availability** — detect whether any form of login or sign-up exists.
   * Return \`true\` if you find elements like *Sign in*, *Log in*, *Sign up*, *Create account*, or OAuth buttons.
   * Otherwise \`false\`.

3. **actions** — list 1 to 5 concrete things a new visitor can do **without logging in**, based on visible CTAs, navigation, or text.
   * Use verbs and be concrete (e.g., "Try a live demo", "Buy a the first product listed under 'Deals'", "Browse the course catalog").
   * Do not include vague or passive actions like "Learn more" or "Buy and choose from millions of products listed".
   * Reading the current page or static content is not an action.
   * Prefer CTAs and buttons over links in the footer or legal sections.
   * Never include privacy policies, cookie notices, or terms & conditions as actions.
   * Never include following links to external websites as actions.
   * If only one valid user-initiated action is presented, return only that one. If there are two, return two — do not add filler.
   * Do not guess actions based on generic labels like “Start” or “More info” unless context makes the action clear.

## Example output

\`\`\`json
{
  "purpose": "Buy and manage running gear through an online store.",
  "login_available": true,
  "actions": [
    "Buy a pair of running shoes",
    "Browse available running gear and compare different models",
    "Sign up for a new customer account"
  ]
}
\`\`\`

## Constraints

* The "purpose" and "actions" fields must always be written in English, regardless of the site language.
* If you're uncertain about an action, omit it rather than make assumptions.
* You are a neutral observer — not a marketer or advocate.
* Ignore cookie banners, privacy policies, and legal links; never list them as user actions.
`;

export const ObservationOutputSchema = z.object({
  purpose: z
    .string()
    .describe("Concise sentence describing the primary purpose of a user visiting the site/app (max ~50 words)."),
  loginAvailable: z
    .boolean()
    .describe("True if login or sign-up is visible on the page; otherwise false."),
  actions: z
    .array(
      z
        .string()
        .describe("A specific user action visible or implied on the page, 12–20 words long.")
    )
    .min(1, "At least 1 action required")
    .max(5, "No more than 5 actions allowed")
    .describe("List of 1-5 main things a first-time visitor can do without logging in."),
});

export type ObservationOutput = z.infer<typeof ObservationOutputSchema>;

export async function observePage(page: string): Promise<ObservationOutput> {
  const isHtml = page.trim().startsWith('<');
  const contentType = isHtml ?
    'A scrubbed HTML body' :
    'Markdown version of the HTML page, annotated with Playwright-style locator hints.';

  const prompt = PROMPT.replace('{contentType}', contentType);

  return await generate(prompt, page, { schema: ObservationOutputSchema });
}
