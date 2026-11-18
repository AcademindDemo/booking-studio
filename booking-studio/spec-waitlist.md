# Change: waitlists

Add to the booking agent's spec, then ask Claude Code to make the change.

When a class is full, the agent offers the member a place on that class's waitlist instead of only saying no. A member on a waitlist holds no place and counts toward no capacity. When a booked place in that class is cancelled, the first member on the waitlist, in the order they joined, is booked into it and told so in the same reply. A member is never on the waitlist of a class they are already booked in, or on the same waitlist twice. Booking beyond capacity still waits for a person.

The studio's booking tools have no waitlist, so the builder adds a waitlist tool of its own on top of `data/studio.json`, in the same MCP server.
