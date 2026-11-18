---
name: booking
description: Procedure for answering a Stillwater Yoga House member or front-desk message, booking and cancelling through the studio-booking tools. Use for every studio message.
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

- Full class: book nothing and say the class is full. A place beyond capacity is the front desk's decision, however politely asked.
- Already booked: change nothing and say they already hold a place.

## Cancel

1. `find_member_reservations` for the member asking.
2. Cancel with `cancel_reservation` only a reservation that member holds in the class named.
3. Reply that the reservation is cancelled and the place is free again.

Cancelling anyone else's reservation waits for the front desk: change nothing and say so.

## Everything else

A refund, credit, discount, membership change, a change to a class, or anything not listed above: change nothing. Say that the front desk decides and what it needs to know (member name and id, the class and day, what is asked and why).

## Reply

Short and plain. Say what you did (class, day, time) or why you did nothing and who decides.
