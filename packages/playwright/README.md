# Playwright Package (`@letsrunit/playwright`)

Low-level Playwright utilities and enhancements for `@letsrunit`. This package provides a robust set of tools for interacting with and extracting information from web pages, optimized for AI-driven automation.

## Exported Utilities

### Element Discovery & Interaction

- **`smartLocator(page, selector)`**: An enhanced locator that supports both standard CSS/XPath and higher-level semantic selectors.
- **`findField(page, label)`**: Finds form fields based on their associated labels or placeholders.
- **`scrollIntoView(locator)`**: Ensures an element is visible before interaction.

### Page Analysis

- **`extractPageInfo(page)`**: A comprehensive helper that extracts the title, URL, metadata, and captures a screenshot of the page.
- **`detectLanguage(page)`**: Detects the primary language of the page content.
- **`snapshot(page)`**: Captures a cleaned-up and formatted HTML snapshot of the current page, optimized for LLM consumption.

### Wait Helpers

- **`waitForIdle(page)`**: Waits for the page to reach a network-idle and stability state.
- **`waitForText(page, text)`**: Waits for specific text to appear on the page.

### DOM & HTML Utilities

- **`formatHtml(html)`**: Prettifies and cleans up HTML strings.
- **`scrubHtml(html)`**: Removes noisy elements (scripts, styles, etc.) from HTML to reduce token usage for AI.
- **`unifiedHtmlDiff(oldHtml, newHtml)`**: Calculates a meaningful diff between two HTML states.

## Testing

Run tests for this package:

```bash
yarn test
```
