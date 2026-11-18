# Stillwater Yoga House booking agent

The booking agent from the course _AI Agents: How They Work and How to Build Them_ on Academind Infinite (Section 7, Building an Agent with a Coding Agent). Claude Code builds it from a spec: a Claude Code project that answers a small yoga studio's booking messages through five booking tools, checks every rule itself and refuses what waits for a person.

## Where you are: `starter`

What you hand Claude Code before it builds, as in _Handing a Spec to a Coding Agent_ (`ag-brief-coding-agent`) and _Watching a Coding Agent Build in a Sandbox_ (`ag-build-in-sandbox`):

- `booking-studio/`: the folder Claude Code builds in.
  - `spec.md`: what the agent does, what done looks like, what it may do alone and what waits for a person.
  - `tools/booking-server.mjs`: the studio's booking system as a local MCP server with five tools, on the official MCP TypeScript SDK. `create_reservation` writes whatever it is given: the checking belongs to the agent.
  - `data/studio.json`: five classes, eighteen members and their reservations.
  - `examples/`: four messages with the behaviour you want, for Claude Code to write its own tests from.
  - `spec-waitlist.md`: a later change, built in _Changing a Built Agent Through the Coding Agent_ (`ag-change-built-agent`).
- `acceptance/`: the held-back tasks you test the built agent with. Keep this folder away from Claude Code while it builds (`acceptance/README.md`).

## Build it

You need Node.js 22 or later and Claude Code (the Code tab of the Claude desktop app, or the `claude` command) on a paid Claude plan.

1. Install the tool server's dependencies and check its tools:

   ```sh
   cd booking-studio
   npm install
   npm test
   ```

2. Open `booking-studio` in Claude Code, choose Plan mode and send the brief the course sent:

   > Build the booking agent for Stillwater Yoga House that spec.md in this folder describes. Read spec.md, examples/ and tools/booking-server.mjs first. The agent is a Claude Code project that runs on this account's subscription, so it needs no API key: Claude Code itself is the worker, with a skill that holds the booking rules and the five tools of tools/booking-server.mjs as an MCP server. Keep the data file out of its reach. Ask me before you guess anything the spec leaves open, and plan before you change anything.

3. Answer its questions, read its plan, then let it build in Manual mode, approving each file and command by what its card says.
4. Test the result with the held-back tasks: `sh acceptance/run.sh`.

Your build will differ from the course's in the details; the acceptance tasks judge only what it does.

Claude Code applies a folder's `.claude/settings.json` to every session there, the one building the agent too. Keep the agent's deny rules to what it must never reach (`data/`, the web): a rule that denies `Read`, `Edit` or `Bash` outright locks the building session out of its own work.

## Checkpoints

| Tag        | State                                                                         | Lectures                                                                                      |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `starter`  | The spec, tools, data and examples Claude Code gets, plus the held-back tasks | `ag-brief-coding-agent`, `ag-build-in-sandbox`                                                |
| `built`    | The agent as Claude Code built it, its tests and a daily check                | `ag-build-in-sandbox`, `ag-built-agent-parts`, `ag-test-built-agent`, `ag-case-booking-agent` |
| `waitlist` | The waitlist change built, every task and check passing                       | `ag-test-built-agent`, `ag-change-built-agent`                                                |
