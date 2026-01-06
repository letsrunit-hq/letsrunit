export const locatorRules = `- Prefer descriptive locators like \`field "Email"\`, \`button "Create invitation"\` or \`text "Hello"\` over raw selectors.
- Use the date locator match date texts (eg \`date of tomorrow\`, \`date of 3 days ago\`, \`date of 1 week from now at 20:00\` or \`date "2025-01-22"\`).
- Prefer field labels like \`field "Your email address"\` over field names like \`field "user_email"\`.
- Prefer aria roles over tag names (eg \`menuitem "Foo"\` for \`<button role="menuitem">Foo</button>\`).
- Use \`link\` for \`<a>\` tags, even if styled as buttons.
- Do not use ambiguous or overly broad selectors.
- Ensure selectors are unambiguous and match exactly one element.
- Use backticks for raw playwright selectors (eg \`When I click \\\`.process-button\\\`\`).
`;
