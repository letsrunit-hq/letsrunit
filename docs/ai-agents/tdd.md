---
description: Make the agent write Gherkin scenarios before writing code.
---

# Test-Driven Development

Test-driven development inverts the usual order of work. Instead of writing code and then writing tests to verify it, you write the test first. The test describes the desired behaviour, fails because the implementation doesn't exist yet, and then the code is written to make it pass. The cycle is short: write a failing test, write the minimum code to pass it, clean up.

The discipline this creates matters more than the tests themselves. Writing the test first forces a precise definition of what done looks like before any implementation decisions are made. Teams that practise TDD tend to write more focused code because the test acts as a specification: if you can't write the test, the requirements aren't clear enough to build.

## Applying this to AI agents

When an agent starts a task without TDD, it typically goes straight to implementation: reads the relevant code, writes the change, maybe runs a check at the end. The implementation decisions happen early, before the agent has fully thought through the expected behaviour.

Asking the agent to write a Gherkin scenario first changes this. Before touching any code, the agent has to think through what the user does, what the interface should show, and what a correct outcome looks like. That is a different kind of thinking: it starts from the user interaction rather than the code structure.

The scenario also makes the requirement concrete in a way that prose does not. "Users should be able to filter by date" is ambiguous. A passing Gherkin scenario is not. If the scenario can be run against the finished implementation and pass, the feature is done. If it fails, it isn't.

The practical effect is that the agent arrives at implementation decisions later and with more context about what it is building. Features written this way tend to match the intended behaviour more closely, because the intended behaviour was defined first.

## AGENTS.md

Add the following to your `AGENTS.md` or `CLAUDE.md`:

```markdown
## Test-driven development

When implementing a feature or fixing a bug that affects the UI, write the Gherkin scenario before writing any implementation code.

1. Write a `.feature` file in `/features` describing the expected user interaction and outcome.
2. Run it with letsrunit to confirm it fails. If it passes, either the feature already exists or the scenario is not testing the right thing.
3. Implement until the scenario passes.
4. Do not modify the scenario to fit the implementation. If the test fails, fix the code.

If you cannot write the scenario before implementing, the requirements are not specific enough. Ask for clarification rather than making assumptions in code.
```
