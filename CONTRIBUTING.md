# Contributing

Contributions are welcome — including those written with AI assistance. What matters is the quality of the result, not how it was produced.

## Standards

**High quality, minimal diff.** A contribution should do exactly what it sets out to do, and nothing more. PRs that reformat unrelated code, rename variables for style, adjust whitespace, or otherwise touch files they have no reason to touch will be rejected outright, regardless of the quality of the actual change.

Before opening a PR, review your diff. Every changed line should be directly necessary for the feature or fix. If you see unrelated changes, revert them.

**Tests are required.** Any new code must be covered by tests. We target 100% coverage in `packages/*`. If a code path genuinely cannot be tested, annotate it with `/* v8 ignore next */` and briefly explain why in the PR description.

**TypeScript strict.** No `any`, no type assertions used to silence errors. Solve the actual problem.

**No speculative work.** Don't add configuration options, abstractions, or fallbacks for scenarios that don't exist yet. Don't refactor code adjacent to your change. Don't add comments explaining things that are self-evident from the code.

## How to Contribute

1. **Open an issue first** for anything non-trivial — a bug report, a feature proposal, or a design question. This avoids wasted effort if the direction isn't right.

2. **Fork and branch.**
   ```bash
   git checkout -b fix/describe-the-fix
   # or feat/, docs/, chore/
   ```

3. **Make your changes.** Follow the conventions in [AGENTS.md](./AGENTS.md).

4. **Run tests locally** before pushing.
   ```bash
   yarn workspace <name> test        # single package
   yarn workspaces foreach -pt run test  # all packages
   ```

5. **Write conventional commits.** Commit messages determine the release version:
   - `fix: correct edge case in step parser` → patch release
   - `feat: add retry support to executor` → minor release
   - `feat!: rename Journal API` → major release
   - `chore:`, `docs:`, `ci:` → no release

6. **Open a pull request** against `main`. Fill in the description: what changed, why, and how to verify it.

## What Gets Rejected

- PRs that change unrelated files (formatting, renames, reorganisation)
- Untested code
- Changes that add complexity without a clear reason
- `any` types or type assertions used as shortcuts
- PRs without a description of what was changed and why

## AI-Generated Contributions

AI-generated PRs are accepted on the same terms as any other. The bar is identical: the code must be correct, tested, minimal, and reviewable. If an AI wrote your PR, you are still responsible for understanding and standing behind every line of it.
