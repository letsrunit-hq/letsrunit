export const locatorRules = `- Prefer descriptive locators like \`field "Email"\`, \`button "Create invitation"\` or \`text "Hello"\` over raw selectors.
- Use \`link\` for \`<a>\` tags, even if styled as buttons.
- Do not use ambiguous or overly broad selectors.
- Ensure selectors are unambiguous and match exactly one element.
- Use backticks for raw playwright selectors (eg \`When I click \\\`.process-button\\\`\`).
`;
