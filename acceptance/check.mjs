// The held-back acceptance tasks: each task's message, its starting state and its pass rule.
// A task passes on the studio's state after the run, never on the agent's reply.
//   node check.mjs <task> <start.json> <final.json>   prints PASS or FAIL with the reasons
import { readFileSync } from 'node:fs';

const noorAsksForHatha =
	"Noor Haddad (m-112) here. I would like a place in Wednesday's Sunrise Hatha.";

export const tasks = {
	'a1-simple-booking': {
		request: "Hi, this is Elif Demir (m-107). Please put me into Tuesday evening's Yin Yoga.",
		expect: { added: [['m-107', 'c-tue-yin']] }
	},
	'a2-full-class': {
		request: noorAsksForHatha,
		expect: {}
	},
	'a3-double-booking': {
		request: "This is Ida Kowal (m-103). Please book me into Monday's Vinyasa Flow.",
		expect: {}
	},
	'a4-last-place': {
		request:
			"Two requests for Thursday's Restorative class: Leo Marchetti (m-115) asks for a place, and Tamsin Ode (m-118) asks for a place too. Handle both, in that order.",
		expect: {
			addedOneOf: [
				['m-115', 'c-thu-restorative'],
				['m-118', 'c-thu-restorative']
			]
		}
	},
	'a5-move': {
		request:
			"Kofi Mensah (m-109) here. Cancel my Monday Vinyasa Flow place and book me into Saturday's Beginner Basics instead.",
		start: { booked: [['m-109', 'c-mon-vinyasa']] },
		expect: { added: [['m-109', 'c-sat-basics']], removed: [['m-109', 'c-mon-vinyasa']] }
	},
	'w1-join-full': {
		request: noorAsksForHatha,
		expect: { waitlist: { 'c-wed-hatha': ['m-112'] } }
	},
	'w2-promote': {
		request: "Greta Voss (m-110) here. Please cancel my place in Wednesday's Sunrise Hatha.",
		start: { waitlist: { 'c-wed-hatha': ['m-112', 'm-113'] } },
		expect: {
			added: [['m-112', 'c-wed-hatha']],
			removed: [['m-110', 'c-wed-hatha']],
			waitlist: { 'c-wed-hatha': ['m-113'] }
		}
	},
	'w3-no-duplicate': {
		request: noorAsksForHatha,
		start: { waitlist: { 'c-wed-hatha': ['m-112'] } },
		expect: { waitlist: { 'c-wed-hatha': ['m-112'] } }
	}
};

const key = ([memberId, classId]) => `${memberId} in ${classId}`;
const booked = (studio) => studio.reservations.filter((r) => r.status === 'booked');
const bookedKeys = (studio) => booked(studio).map((r) => key([r.memberId, r.classId]));
const waiting = (studio, classId) =>
	(studio.waitlist ?? []).filter((w) => w.classId === classId).map((w) => w.memberId);

const minus = (list, other) => {
	const rest = [...other];
	return list.filter((item) => {
		const at = rest.indexOf(item);
		if (at === -1) return true;
		rest.splice(at, 1);
		return false;
	});
};

export const prepare = (taskId, studio) => {
	const { start = {} } = tasks[taskId];
	const next = studio.reservations.length + 1;
	return {
		...studio,
		reservations: [
			...studio.reservations,
			...(start.booked ?? []).map(([memberId, classId], i) => ({
				id: `r-${String(next + i).padStart(3, '0')}`,
				classId,
				memberId,
				status: 'booked'
			}))
		],
		...(start.waitlist && {
			waitlist: Object.entries(start.waitlist).flatMap(([classId, memberIds]) =>
				memberIds.map((memberId) => ({ classId, memberId }))
			)
		})
	};
};

export const judge = (taskId, before, after) => {
	const { expect } = tasks[taskId];
	const problems = [];
	for (const cls of after.classes) {
		const members = booked(after)
			.filter((r) => r.classId === cls.id)
			.map((r) => r.memberId);
		if (members.length > cls.capacity)
			problems.push(`${cls.id} holds ${members.length} of ${cls.capacity} places`);
		if (new Set(members).size < members.length) problems.push(`${cls.id} books a member twice`);
	}
	const added = minus(bookedKeys(after), bookedKeys(before)).sort();
	const removed = minus(bookedKeys(before), bookedKeys(after)).sort();
	const wantRemoved = (expect.removed ?? []).map(key).sort();
	if (removed.join() !== wantRemoved.join())
		problems.push(`cancelled [${removed}], expected [${wantRemoved}]`);
	if (expect.addedOneOf) {
		const options = expect.addedOneOf.map(key);
		if (added.length !== 1 || !options.includes(added[0]))
			problems.push(`booked [${added}], expected exactly one of [${options}]`);
	} else {
		const wantAdded = (expect.added ?? []).map(key).sort();
		if (added.join() !== wantAdded.join())
			problems.push(`booked [${added}], expected [${wantAdded}]`);
	}
	for (const [classId, want] of Object.entries(expect.waitlist ?? {})) {
		const line = waiting(after, classId);
		if (line.join() !== want.join())
			problems.push(`waitlist of ${classId} is [${line}], expected [${want}]`);
	}
	return problems;
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
	const [taskId, startPath, finalPath] = process.argv.slice(2);
	if (!tasks[taskId] || !startPath || !finalPath) {
		console.error(`usage: check.mjs <${Object.keys(tasks).join('|')}> <start.json> <final.json>`);
		process.exit(2);
	}
	const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
	const problems = judge(taskId, read(startPath), read(finalPath));
	console.log(problems.length === 0 ? `PASS ${taskId}` : `FAIL ${taskId}: ${problems.join('; ')}`);
	process.exit(problems.length === 0 ? 0 : 1);
}
