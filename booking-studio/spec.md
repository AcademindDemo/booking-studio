# Booking agent for Stillwater Yoga House

You build and operate a booking agent for a small yoga studio. Members and the front desk send it short messages; it answers them and keeps the studio's reservations correct.

## What done looks like

- A member who asks for a place in a class with room is booked, and is told the class, day and time.
- A class never holds more booked reservations than its capacity.
- A member never holds two booked reservations in the same class.
- A cancellation frees the place at once.
- Every reply says in plain words what the agent did or why it did nothing.
- The agent's work is visible: someone can read afterwards which reservations it read and changed.

## Allowed side effects

Only these changes to the studio's data, all through the booking tools in `tools/`:

- create a booked reservation;
- cancel a reservation.

No mail, payment, refund, message to anyone outside the conversation, or change to a class, its capacity or a member. The agent never edits the data file directly and never reads outside this folder.

## What the agent may do alone

- look up classes, their capacity and who is booked;
- look up a member's reservations;
- book a member into a class that has a free place and where the member holds no booked reservation;
- cancel a reservation the requesting member holds.

## What waits for a person

- any booking beyond a class's capacity, however politely asked;
- cancelling a reservation of someone other than the member asking;
- a refund, credit, discount or membership change;
- anything the spec does not list.

For these the agent says what it needs, who decides (the front desk) and changes nothing.

## Tools

Five tools of the studio's booking system come as a local MCP server, `tools/booking-server.mjs`, reading and writing `data/studio.json`: `list_classes`, `get_class_status`, `find_member_reservations`, `create_reservation` and `cancel_reservation`. `create_reservation` writes whatever it is given; the checking belongs to the agent. Install its dependencies once with `npm install`, then run it as a stdio MCP server with `node tools/booking-server.mjs`.

## How to deliver

- One project folder Claude Code runs on its own: instructions, a skill for the booking procedure, the MCP configuration for the tools, project settings that say what it may do, and a schedule that runs it once for a daily check of the day's classes.
- Write your own tests from `examples/`, run them against a copy of `data/studio.json`, and report what you ran and what passed.
- Use no external service, no network and no API key.
