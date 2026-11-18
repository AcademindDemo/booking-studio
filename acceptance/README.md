# Held-back acceptance tasks

Messages a member or the front desk sends the booking agent, each with a starting state and a rule for the state it must leave. Keep this folder outside `booking-studio/` and never show it to Claude Code while it builds: tasks it has seen stop telling you whether the agent works.

A task passes only on the reservations (and waitlists) after the run. The agent's reply is read, but it never decides. Every task also fails when a class ends above its capacity, a member holds two places in one class, or any other booking changed.

## Run them

You need Node.js 22 or later and Claude Code signed in. From the folder that holds `booking-studio/` and `acceptance/`:

```sh
sh acceptance/run.sh
```

It runs a1 to a5 twice each, every run on a fresh copy of `studio.json` (the studio data as handed over, kept here), through `claude -p --permission-mode dontAsk` in `booking-studio/`, so only what the agent's `.claude/settings.json` allows runs. Then it prints one line per run, `PASS` or `FAIL` with the reason, and keeps everything in `acceptance/runs/<time>/`:

- `summary.txt`: the verdicts;
- `<task>-<n>/trace.txt`: the activity log, every tool call (`CALL`), its result (`RESULT`) and what the agent said (`SAY`), to find the first wrong step of a failure;
- `start.json`, `final.json` and `calls.jsonl`: the state before and after, and the tool server's own log.

Pick tasks and repeats: `sh acceptance/run.sh booking-studio "a2-full-class a4-last-place" 5`. Runs use your Claude plan's usage; each takes about a minute.

## Tasks

| Task              | Starting state                                                                                                 | Message                                                   | Passes when                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| a1-simple-booking | Yin Yoga, Tuesday 18:30, 4 of 10 taken; Elif Demir (m-107) not booked                                          | Elif asks for a place in Tuesday's Yin Yoga               | Elif holds one place in Yin Yoga, 5 of 10, nothing else changed                                           |
| a2-full-class     | Sunrise Hatha, Wednesday 07:30, 6 of 6; Noor Haddad (m-112) not booked                                         | Noor asks for a place in Sunrise Hatha                    | No booking added, Sunrise Hatha stays 6 of 6, nothing else changed                                        |
| a3-double-booking | Ida Kowal (m-103) holds a place in Vinyasa Flow, Monday 09:00, 5 of 12                                         | Ida asks to be booked into Vinyasa Flow                   | Ida still holds one place, 5 of 12, nothing else changed                                                  |
| a4-last-place     | Restorative, Thursday 19:00, 7 of 8; Leo Marchetti (m-115) and Tamsin Ode (m-118) not booked                   | Both ask for a place, Leo first                           | Exactly one of them is booked, 8 of 8, nothing else changed                                               |
| a5-move           | Kofi Mensah (m-109) holds a place in Vinyasa Flow (6 of 12), none in Beginner Basics, Saturday 10:00 (3 of 10) | Kofi asks to cancel Vinyasa Flow and book Beginner Basics | Vinyasa Flow cancelled (5 of 12), Kofi holds one place in Beginner Basics (4 of 10), nothing else changed |

a2, a3 and a4 are the tasks an agent fails when it never checks free places or existing bookings: the booking tools write whatever they are given.

## Waitlist checks

Written before the waitlist change (`booking-studio/spec-waitlist.md`) goes to Claude Code, and run together with a1 to a5 after it, since a change in one part can break another:

```sh
sh acceptance/run.sh booking-studio "w1-join-full w2-promote w3-no-duplicate a1-simple-booking a2-full-class a3-double-booking a4-last-place a5-move" 1
```

| Check           | Starting state                                                | Message                                               | Passes when                                                                |
| --------------- | ------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| w1-join-full    | Sunrise Hatha 6 of 6, no waitlist                             | Noor (m-112) asks for a place, the same message as a2 | Noor is on the Sunrise Hatha waitlist once, no booking added, still 6 of 6 |
| w2-promote      | Sunrise Hatha 6 of 6, waitlist Noor, then Lena Petrov (m-113) | Greta Voss (m-110) cancels her Sunrise Hatha place    | Greta cancelled, Noor booked (6 of 6), Lena still waiting                  |
| w3-no-duplicate | Noor first on the Sunrise Hatha waitlist                      | Noor asks again for a place                           | Noor is on the waitlist once, nothing else changed                         |

The checks read the waitlist as the course's build stores it: a `waitlist` list of `{ "classId", "memberId" }` in the studio data, oldest first. If your build keeps it another way, change `waiting` in `check.mjs` to read it.

## The files

- `check.mjs`: every task's message, starting state and pass rule; `node acceptance/check.mjs <task> <start.json> <final.json>` judges one run.
- `reset.mjs`: `node acceptance/reset.mjs <task> <start.json>` writes a task's starting state and prints its message, to run one by hand.
- `run.sh`: runs tasks through Claude Code and judges them.
- `trace.mjs`: turns a run's `stream-json` output into the readable activity log.
- `check.test.mjs`: `node --test acceptance/check.test.mjs` checks the pass rules themselves.

To make tasks for your own agent, keep the shape: a message, a starting state, and a rule on the state it leaves.
