![letsrunit](https://cdn.jsdelivr.net/gh/letsrunit-hq/letsrunit@main/docs/.gitbook/assets/logo-light.svg)

# CLI

The `letsrunit` CLI allows you to explore websites, generate Gherkin features using AI, run tests locally, and explain recent failures.

## Commands

### `explore`
Navigates a target URL and allows interactive discovery of features.
```bash
yarn cli explore --target <url>
```

### `generate`
Generates a `.feature` file from natural language instructions.
```bash
echo "Login with email and password" | yarn cli generate --target <url> -o ./features
```

### `explain`
Explains failures from the latest run in `.letsrunit/letsrunit.db`.
```bash
yarn cli explain
yarn cli explain --db .letsrunit/letsrunit.db --artifacts .letsrunit/artifacts
```

## Options
- `-t, --target <target>`: Target URL or project. If omitted, letsrunit reads `worldParameters` from `cucumber.js` (for example `baseURL`) and falls back to `http://localhost:3000`.
- `-v, --verbose`: Enable verbose logging.
- `-s, --silent`: Only output errors.
- `-o, --save <path>`: Path to save generated artifacts/features.
