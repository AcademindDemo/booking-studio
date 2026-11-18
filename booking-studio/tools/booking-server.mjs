// Stillwater Yoga House's booking system as a local MCP server (stdio).
// Its five tools read and write data/studio.json and log every call to data/calls.jsonl.
// create_reservation checks nothing on purpose: the checking belongs to the agent.
// Run: node tools/booking-server.mjs (after npm install). BOOKING_DATA and BOOKING_CALLS
// point it at another data file and log, e.g. a copy for a test run.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod';

const dataPath =
	process.env.BOOKING_DATA ?? new URL('../data/studio.json', import.meta.url).pathname;
const callsPath =
	process.env.BOOKING_CALLS ?? new URL('../data/calls.jsonl', import.meta.url).pathname;

const load = () => JSON.parse(readFileSync(dataPath, 'utf8'));
const save = (studio) => writeFileSync(dataPath, `${JSON.stringify(studio, null, 2)}\n`);
const booked = (studio, classId) =>
	studio.reservations.filter((r) => r.classId === classId && r.status === 'booked');

const classId = z.string().describe('Class id from list_classes, such as c-tue-yin');
const memberId = z.string().describe('Member id, such as m-104');
const local = { openWorldHint: false };

const tools = {
	list_classes: {
		title: 'List classes',
		description:
			'List every class with its id, day and time, name and capacity. Does not say how many places are taken.',
		inputSchema: z.object({}),
		annotations: { ...local, readOnlyHint: true },
		run: (studio) => studio.classes
	},
	get_class_status: {
		title: 'Get class status',
		description:
			'Show one class with its capacity, the number of booked places and the members booked.',
		inputSchema: z.object({ classId }),
		annotations: { ...local, readOnlyHint: true },
		run: (studio, args) => {
			const cls = studio.classes.find((c) => c.id === args.classId);
			if (!cls) return { error: `No class ${args.classId}` };
			const rows = booked(studio, args.classId);
			return { ...cls, bookedPlaces: rows.length, bookedMembers: rows.map((r) => r.memberId) };
		}
	},
	find_member_reservations: {
		title: "Find a member's reservations",
		description: 'List the booked reservations of one member, with their reservation ids.',
		inputSchema: z.object({ memberId }),
		annotations: { ...local, readOnlyHint: true },
		run: (studio, args) =>
			studio.reservations.filter((r) => r.memberId === args.memberId && r.status === 'booked')
	},
	create_reservation: {
		title: 'Create a reservation',
		description:
			'Write a booked reservation for a member in a class. It does not check capacity and does not check for an existing reservation: it always writes.',
		inputSchema: z.object({ memberId, classId }),
		annotations: { ...local, readOnlyHint: false, destructiveHint: false, idempotentHint: false },
		run: (studio, args) => {
			if (!studio.members.some((m) => m.id === args.memberId))
				return { error: `No member ${args.memberId}` };
			if (!studio.classes.some((c) => c.id === args.classId))
				return { error: `No class ${args.classId}` };
			const next = Math.max(0, ...studio.reservations.map((r) => Number(r.id.slice(2)))) + 1;
			const reservation = {
				id: `r-${String(next).padStart(3, '0')}`,
				classId: args.classId,
				memberId: args.memberId,
				status: 'booked'
			};
			studio.reservations.push(reservation);
			save(studio);
			return reservation;
		}
	},
	cancel_reservation: {
		title: 'Cancel a reservation',
		description: 'Cancel one booked reservation by its reservation id. The place becomes free.',
		inputSchema: z.object({
			reservationId: z.string().describe('Reservation id, such as r-012')
		}),
		annotations: { ...local, readOnlyHint: false, destructiveHint: true, idempotentHint: true },
		run: (studio, args) => {
			const reservation = studio.reservations.find((r) => r.id === args.reservationId);
			if (!reservation) return { error: `No reservation ${args.reservationId}` };
			reservation.status = 'cancelled';
			save(studio);
			return reservation;
		}
	}
};

const createServer = () => {
	const server = new McpServer({ name: 'studio-booking', version: '1.0.0' });
	for (const [name, { run, ...config }] of Object.entries(tools)) {
		server.registerTool(name, config, async (args) => {
			const result = run(load(), args);
			appendFileSync(callsPath, `${JSON.stringify({ tool: name, args, result })}\n`);
			return {
				content: [{ type: 'text', text: JSON.stringify(result) }],
				isError: 'error' in result
			};
		});
	}
	return server;
};

const handle = serveStdio(createServer);
process.on('SIGINT', () => void handle.close());
process.on('SIGTERM', () => void handle.close());
