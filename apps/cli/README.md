# CLI

The `letsrunit` CLI allows you to explore websites, generate Gherkin features using AI, and run tests locally.

## Commands

### `explore`
Navigates a target URL and allows interactive discovery of features.
```bash
yarn cli explore <url>
```

### `generate`
Generates a `.feature` file from natural language instructions.
```bash
echo "Login with email and password" | yarn cli generate <url> -o ./features
```

### `run`
Executes a Gherkin feature file against a target URL.
```bash
yarn cli run <url> ./features/login.feature
```

## Options
- `-v, --verbose`: Enable verbose logging.
- `-s, --silent`: Only output errors.
- `-o, --save <path>`: Path to save generated artifacts/features.
