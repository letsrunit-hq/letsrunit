# MCP comparison

There are multiple MCP servers that allow AI agents to interact with a browser. They differ mainly in abstraction level and purpose. Chrome DevTools MCP focuses on inspection, Playwright MCP on interaction, and letsrunit MCP on executing complete workflows.

| Aspect             | Chrome DevTools MCP      | Playwright MCP       | letsrunit MCP                   |
| ------------------ | ------------------------ | -------------------- | ------------------------------- |
| Level              | Low                      | Medium               | High                            |
| Focus              | Debugging and inspection | Browser control      | Scenario execution              |
| Agent perspective  | “What is happening?”     | “Can I do this?”     | “Does this work correctly?”     |
| Abstraction        | DOM, CSS, network        | Elements and actions | User behavior and workflows     |
| Determinism        | Low                      | High                 | Very high                       |
| Token usage        | High                     | Medium               | **Low**                         |
| Selector handling  | Manual                   | Manual               | **Abstracted and resilient**    |
| State across runs  | None                     | None                 | **Full history with artifacts** |
| Regression insight | None                     | Limited              | **Built-in comparison of runs** |
| External systems   | No                       | No                   | **Yes (email, auth flows)**     |
| Primary use        | Debugging issues         | Automating flows     | Validating behavior over time   |

### Chrome DevTools MCP

Chrome DevTools MCP exposes browser internals. It gives access to computed styles, layout, network traffic, console logs, and performance data. This makes it the right tool when something is visually or technically wrong and you need to understand why.

It is not designed for repeatable execution. The agent has to interpret raw data and decide what to do next, which makes it relatively heavy in both reasoning and token usage.

### Playwright MCP

Playwright MCP provides structured control over the browser. It allows an agent to navigate, click, type, and assert state in a deterministic way. Compared to DevTools, it is much more suitable for executing flows.

However, the agent is still responsible for managing selectors and flow logic. There is no built-in notion of history, reuse, or regression tracking. Each run is effectively isolated.

### letsrunit MCP

letsrunit MCP operates at the level of scenarios instead of individual actions. Agents execute workflows composed of reusable steps, rather than issuing low-level commands.

The key difference is that execution is stateful across runs. letsrunit stores artifacts such as HTML snapshots, screenshots, and step results, together with the associated git commit. When a run fails, the agent can compare it with previous successful runs and relate differences to code changes.

Selector handling is abstracted, which reduces fragility when the UI changes. In addition, integrations like mailbox handling make it possible to cover real end-to-end flows such as authentication, invites, and password resets.

## Positioning

These tools operate at different layers and are complementary.

Chrome DevTools MCP is for debugging. Playwright MCP is for interaction. letsrunit MCP is for validating behavior over time.

If the goal is to inspect or fix a specific issue, DevTools is the right choice. If the goal is to explore or automate a flow, Playwright fits. If the goal is to reliably execute and evaluate workflows, especially across changes, letsrunit is the better fit.

