![letsrunit](https://cdn.jsdelivr.net/gh/letsrunit-hq/letsrunit@main/docs/.gitbook/assets/logo-light.svg)

# AI

## Installation

```bash
npm install @letsrunit/ai
# or
yarn add @letsrunit/ai
```

Install `langsmith` as well if you want LangSmith tracing:

```bash
npm install langsmith
# or
yarn add langsmith
```

Provides AI-driven capabilities for the `letsrunit` platform, leveraging the [AI SDK](https://sdk.vercel.ai/). It serves as a unified interface for generating text or structured objects using LLMs.

## Exported Functions

### `generate<T>(system, prompt, opts)`

The primary function for interacting with LLMs. It supports both text generation and structured object generation (via Zod schemas).

- **`system`**: The system prompt. Can be a string or a template object `{ template: string; vars: object }` (rendered using Mustache).
- **`prompt`**: The user prompt (string) or an array of `ModelMessage`.
- **`opts`**:
  - `model`: `'large' | 'medium' | 'small'` (defaults to `medium`).
  - `reasoningEffort`: `'minimal' | 'low' | 'medium'` (defaults to `low`).
  - `schema`: A Zod schema. If provided, `generate` returns a typed object.
  - `tools`: A set of AI SDK tools (cannot be used with `schema`).
  - `abortSignal`: An `AbortSignal` to cancel the request.

### `translate<T>(input, lang, options)`

Translates text or JSON objects from English to a target language.

- **`input`**: A string or a JSON-serializable value.
- **`lang`**: Target language code (e.g., `'nl'`, `'fr'`).
- **`options`**:
  - `cache`: An optional `cache-manager` instance to cache translations.
  - `prompt`: An optional custom translation prompt.
  - `reasoningEffort`: LLM reasoning effort level.

## Environment Variables

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `TOGETHER_AI_API_KEY`
- `LETSRUNIT_AI_PROVIDER` (`openai`, `anthropic`, or `google`; defaults to `openai`)
- `LETSRUNIT_MODEL_LARGE`
- `LETSRUNIT_MODEL_MEDIUM`
- `LETSRUNIT_MODEL_SMALL`

### LangSmith tracing (optional)

LangSmith tracing is loaded lazily. If you configure any of the variables below, `langsmith@>=0.6.0` must also be installed.

- `LANGSMITH_TRACING`
- `LANGSMITH_WORKSPACE_ID`
- `LANGSMITH_API_KEY`
- `LANGSMITH_ENDPOINT`
- `LANGSMITH_PROJECT`

## Testing

Run tests for this package:

```bash
yarn test
```
