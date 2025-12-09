import { generate } from '@letsrunit/ai';
import type { Feature } from '@letsrunit/gherkin';
import { clean } from '@letsrunit/utils';
import { ActionSchema } from '../types';

const PROMPT = `The user tells you what they want to test on a website or webapp. Your task is to convert this into
**one clear action** using the format below.

### Rules

* The action must be something a user could realistically do on a site or webapp.
* The **name** starts with a direct verb (e.g., "Add a product", "Submit a form").
* The **description** describes what the user intends to test and how it would be performed.
* The **done** field states when this action is considered complete.
* All output must be **English**.
* Do not add anything beyond the one action.

---

## Example

**User instruction:**
"I want to test uploading a profile picture."

**Your output:**

\`\`\`
{
  "name": "Upload a profile picture",
  "description": "Open the profile page, choose an image file, and upload it to update the profile picture.",
  "done": "The new profile picture is displayed."
}
\`\`\`
`;

function suggestionToInstructions(suggestion: Pick<Feature, 'name' | 'description' | 'comments'>) {
  return clean([
    suggestion.name && `# ${suggestion.name}\n`,
    suggestion.description,
    suggestion.comments && `\n_${suggestion.comments}_`,
  ]).join('\n');
}

export async function refineSuggestion(
  suggestion: string | Pick<Feature, 'name' | 'description' | 'comments'>,
): Promise<Required<Pick<Feature, 'name' | 'description' | 'comments'>>> {
  const instructions = typeof suggestion === 'string' ? suggestion : suggestionToInstructions(suggestion);
  if (!instructions) throw new Error('No test instructions');

  const action = await generate(PROMPT, instructions, {
    schema: ActionSchema,
    model: 'large',
    reasoningEffort: 'medium',
  });

  return {
    name: action.name,
    description: action.description,
    comments: `Definition of done: ${action.done}`,
  };
}
