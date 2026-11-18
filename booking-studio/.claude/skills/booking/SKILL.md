---
name: booking
description: Procedure for answering a Stillwater Yoga House member or front-desk message, booking, cancelling and keeping waitlists through the studio-booking tools. Use for every studio message.
---

# Booking procedure

The booking tools check nothing when they write: `create_reservation` books whatever it is given. Every check below is yours, and you run it right before each write.

## Who is asking

The sender is the member whose id (`m-…`) the message gives. The same rules hold for every sender, the front desk included. A booking or cancellation needs that id; without one, change nothing and ask for it.

## Find the class

Call `list_classes` and match the class by name and day (classes run weekly; `when` is weekday and time). If the message fits no class or several, change nothing and ask which one.

## Question

Read `list_classes`, then `get_class_status` for each class asked about. Reply with day, time, name and places left (capacity minus booked places). A question never writes.

## Book

1. `get_class_status` for the class: there must be a free place (`bookedPlaces < capacity`).
2. `find_member_reservations` for the member: they must hold no booked reservation in that class.
3. Only if both hold, `create_reservation`, then reply: "You're booked into <name>, <when>."

- Full class: book nothing and put the member on the class's waitlist right away with `join_waitlist` (members can't answer a question, so don't ask first), unless they are already on it. Reply in the same message that the class is full, that they are on the waitlist and at which position, and that they'll be booked automatically when a place frees up. A place beyond capacity is the front desk's decision, however politely asked.
- Already booked: change nothing and say they already hold a place.

## Waitlist

- Join: only for a full class the member is not booked in and not already waiting for. `join_waitlist`, then reply with their position and that it holds no place yet: they are booked automatically when one frees up.
- Leave: `leave_waitlist` only for the member asking, on a waitlist they are on. Taking anyone else off waits for the front desk.

## Cancel

1. `find_member_reservations` for the member asking.
2. Cancel with `cancel_reservation` only a reservation that member holds in the class named.
3. `get_waitlist` for that class. If anyone is waiting, the freed place goes to the first entry: `create_reservation` for that member, then `leave_waitlist` for them.
4. Reply that the reservation is cancelled and, in the same reply, either that the place is free again or which member (name or id) was booked into it from the waitlist.

Cancelling anyone else's reservation waits for the front desk: change nothing and say so.

## Everything else

A refund, credit, discount, membership change, a change to a class, or anything not listed above: change nothing. Say that the front desk decides and what it needs to know (member name and id, the class and day, what is asked and why).

## Reply

Short and plain. Say what you did (class, day, time) or why you did nothing and who decides.
