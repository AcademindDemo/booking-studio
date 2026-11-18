# Stillwater Yoga House booking agent

The booking agent from the course _AI Agents: How They Work and How to Build Them_ on Academind Infinite (Section 7, Building an Agent with a Coding Agent). Claude Code builds it from a spec: a Claude Code project that answers a small yoga studio's booking messages through five booking tools, checks every rule itself and refuses what waits for a person.

## Where you are: `built`

The agent as Claude Code built it from the spec, as in _Watching a Coding Agent Build in a Sandbox_ (`ag-build-in-sandbox`), _Finding the Parts in a Built Agent's Files_ (`ag-built-agent-parts`), _Testing the Built Agent with Acceptance Tasks_ (`ag-test-built-agent`) and _Case: Checking a Yoga Studio's Booking Agent Before Release_ (`ag-case-booking-agent`). It is a Claude Code project: Claude Code itself is the worker, so it runs on your Claude subscription with no API key.

- `booking-studio/`, the agent:
  - `AGENTS.md` (`CLAUDE.md` links to it): the job and the rules every session in this folder loads.
  - `.claude/skills/booking/SKILL.md`: the booking procedure, step by step, for booking, cancelling and questions.
  - `.claude/skills/daily-check/SKILL.md`: a read-only check of one day's classes, written to `reports/<date>.md`.
  - `.mcp.json`: starts `tools/booking-server.mjs` as the MCP server `studio-booking`.
  - `.claude/settings.json`: allows the five booking tools, the two skills and writing `reports/`; denies reading or editing `data/` and the web.
  - `tests/agent.test.mjs`: nine real runs of the agent (`claude -p`) on copies of the data, the four examples and five rule cases.
  - `spec.md`, `tools/`, `data/` and `examples/` as at `starter`.
- `acceptance/`: the held-back tasks, unchanged, kept outside the agent's folder.

## Run it

You need Node.js 22 or later and Claude Code on a paid Claude plan.

1. Install the tool server's dependencies and check its tools:

   ```sh
   cd booking-studio
   npm install
   npm test
   ```

2. Trust the folder once: run `claude` in `booking-studio` and accept the trust dialog. Until a folder is trusted, Claude Code ignores the allow list in its `.claude/settings.json`, so the agent can't use a single booking tool.
3. Send the agent a message. `dontAsk` refuses every tool the settings don't allow, instead of asking you:

   ```sh
   claude --permission-mode dontAsk -p "Hi, Sol Ferreira (m-104) here. Please book me into Saturday's Beginner Basics."
   ```

   `data/calls.jsonl` then lists every tool call it made.

4. Run its own tests (several minutes): `node --test 'tests/*.test.mjs'`.
5. Run the held-back tasks from the repository's root: `sh acceptance/run.sh`. Each task runs twice on a fresh copy of the data and is judged on the data it leaves.
6. Schedule the daily check in the Claude desktop app: in the Code tab click **Scheduled**, then **New task**, choose the `booking-studio` folder, the prompt `/daily-check` and a daily schedule at 07:00. A local scheduled task runs only while the app is open and the computer awake.

### When you build your own

Claude Code applies a folder's `.claude/settings.json` to every session there, the one building the agent too. Keep the agent's deny rules to what it must never reach (`data/`, the web): a rule that denies `Read`, `Edit` or `Bash` outright locks the building session out of its own work.

## Checkpoints

| Tag        | State                                                                         | Lectures                                                                                      |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `starter`  | The spec, tools, data and examples Claude Code gets, plus the held-back tasks | `ag-brief-coding-agent`, `ag-build-in-sandbox`                                                |
| `built`    | The agent as Claude Code built it, its tests and a daily check                | `ag-build-in-sandbox`, `ag-built-agent-parts`, `ag-test-built-agent`, `ag-case-booking-agent` |
| `waitlist` | The waitlist change built, every task and check passing                       | `ag-test-built-agent`, `ag-change-built-agent`                                                |
