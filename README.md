# Stillwater Yoga House booking agent

The booking agent from the course _AI Agents: How They Work and How to Build Them_ on Academind Infinite (Section 7, Building an Agent with a Coding Agent). Claude Code builds it from a spec: a Claude Code project that answers a small yoga studio's booking messages through the studio's booking tools, checks every rule itself and refuses what waits for a person.

## Where you are: `waitlist`

The agent after the waitlist change, as in _Changing a Built Agent Through the Coding Agent_ (`ag-change-built-agent`). `booking-studio/spec-waitlist.md` went to Claude Code as a change request. The waitlist checks w1 to w3 from _Testing the Built Agent with Acceptance Tasks_ (`ag-test-built-agent`) were written before the change, and every task and test passed after it. It is a Claude Code project: Claude Code itself is the worker, so it runs on your Claude subscription with no API key.

What the change touched in `booking-studio/`:

- `spec.md`: a Waitlists section, and the waitlist actions among what the agent may do alone.
- `tools/booking-server.mjs`: three waitlist tools on top of `data/studio.json` (`get_waitlist`, `join_waitlist` and `leave_waitlist`), with the waitlist kept in the data file as an ordered list. `tools/booking-server.test.mjs` checks them.
- `.claude/skills/booking/SKILL.md`: a full class puts the member on its waitlist in the same reply, and a cancellation books the first member waiting.
- `AGENTS.md`: the waitlist among the changes the agent may make.
- `.claude/settings.json`: the three waitlist tools allowed.
- `tests/agent.test.mjs`: five waitlist cases added, fourteen runs in all.

Everything else is as at `built`:

- the daily check (`.claude/skills/daily-check/SKILL.md`);
- `.mcp.json`;
- the data;
- the held-back tasks in `acceptance/`.

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
5. Run the held-back tasks from the repository's root. Run the waitlist checks together with a1 to a5, since a change in one part can break another:

   ```sh
   sh acceptance/run.sh booking-studio "w1-join-full w2-promote w3-no-duplicate a1-simple-booking a2-full-class a3-double-booking a4-last-place a5-move"
   ```

   Each task runs twice on a fresh copy of the data and is judged on the data it leaves.

6. Schedule the daily check in the Claude desktop app: in the Code tab click **Scheduled**, then **New task**, choose the `booking-studio` folder, the prompt `/daily-check` and a daily schedule at 07:00. A local scheduled task runs only while the app is open and the computer awake.

### When you build your own

Claude Code applies a folder's `.claude/settings.json` to every session there, the one building the agent too. Keep the agent's deny rules to what it must never reach (`data/`, the web): a rule that denies `Read`, `Edit` or `Bash` outright locks the building session out of its own work.

## Checkpoints

| Tag        | State                                                                         | Lectures                                                                                      |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `starter`  | The spec, tools, data and examples Claude Code gets, plus the held-back tasks | `ag-brief-coding-agent`, `ag-build-in-sandbox`                                                |
| `built`    | The agent as Claude Code built it, its tests and a daily check                | `ag-build-in-sandbox`, `ag-built-agent-parts`, `ag-test-built-agent`, `ag-case-booking-agent` |
| `waitlist` | The waitlist change built, every task and check passing                       | `ag-test-built-agent`, `ag-change-built-agent`                                                |
