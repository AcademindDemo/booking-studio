// Runs the booking agent (real `claude -p` on the subscription) against a copy of
// data/studio.json per case, then checks the final state, the tool calls and the reply.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
	copyFileSync,
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';

const root = new URL('..', import.meta.url).pathname;
const seed = join(root, 'data/studio.json');
const run = promisify(execFile);

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const readCalls = (path) =>
	existsSync(path)
		? readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
		: [];

// Sends one message to the agent. `setup` may change the copied studio data first;
// `before` is the data the agent started from.
const ask = async (t, message, { setup } = {}) => {
	const dir = mkdtempSync(join(tmpdir(), 'stillwater-test-'));
	t.after(() => rmSync(dir, { recursive: true }));
	const data = join(dir, 'studio.json');
	const calls = join(dir, 'calls.jsonl');
	copyFileSync(seed, data);
	if (setup) writeFileSync(data, JSON.stringify(setup(readJson(data))));
	const before = readJson(data);
	const { stdout } = await run(
		'claude',
		['-p', '--permission-mode', 'dontAsk', '--output-format', 'json', message],
		{
			cwd: root,
			env: { ...process.env, BOOKING_DATA: data, BOOKING_CALLS: calls },
			timeout: 300_000
		}
	);
	const reply = JSON.parse(stdout).result;
	t.diagnostic(`reply: ${reply}`);
	return { reply, before, after: readJson(data), calls: readCalls(calls) };
};

const booked = (studio) => studio.reservations.filter((r) => r.status === 'booked');
const holds = (studio, memberId, classId) =>
	booked(studio).filter((r) => r.memberId === memberId && r.classId === classId).length;
const waiting = (studio, classId) =>
	(studio.waitlist ?? []).filter((w) => w.classId === classId).map((w) => w.memberId);
const writeTools = ['create_reservation', 'cancel_reservation', 'join_waitlist', 'leave_waitlist'];
const writes = (calls) => calls.filter((c) => writeTools.includes(c.tool) && !c.result.error);

// Sunrise Hatha (Wednesday) is full at 6 of 6; Greta (m-110) holds one of its places.
const hathaWaitlist = (memberIds) => (studio) => ({
	...studio,
	waitlist: memberIds.map((memberId) => ({ classId: 'c-wed-hatha', memberId }))
});

const assertInvariants = (studio) => {
	for (const cls of studio.classes) {
		const rows = booked(studio).filter((r) => r.classId === cls.id);
		assert.ok(rows.length <= cls.capacity, `${cls.id} over capacity`);
		assert.equal(new Set(rows.map((r) => r.memberId)).size, rows.length, `${cls.id} duplicate`);
		const line = waiting(studio, cls.id);
		assert.equal(new Set(line).size, line.length, `${cls.id} waitlist duplicate`);
		assert.ok(
			!line.some((m) => rows.some((r) => r.memberId === m)),
			`${cls.id} booked and waiting`
		);
	}
};

const assertUnchanged = ({ before, after, calls }) => {
	assert.deepEqual(after, before);
	assert.deepEqual(writes(calls), []);
};

test('01 books a member into a class with room', async (t) => {
	const r = await ask(
		t,
		"Hi, Sol Ferreira (m-104) here. Please book me into Saturday's Beginner Basics."
	);
	assertInvariants(r.after);
	assert.equal(holds(r.after, 'm-104', 'c-sat-basics'), 1);
	assert.equal(booked(r.after).filter((x) => x.classId === 'c-sat-basics').length, 4);
	assert.equal(r.after.reservations.length, r.before.reservations.length + 1);
	assert.ok(
		r.calls.some((c) => c.tool === 'get_class_status'),
		'checked the class'
	);
	assert.ok(
		r.calls.some((c) => c.tool === 'find_member_reservations'),
		"checked Sol's bookings"
	);
	assert.match(r.reply, /Beginner Basics/);
	assert.match(r.reply, /Saturday/);
	assert.match(r.reply, /10:00/);
});

test('02 answers a question without writing', async (t) => {
	const r = await ask(t, 'What classes are on Monday and Tuesday, and are there places left?');
	assertUnchanged(r);
	assert.ok(
		r.calls.some((c) => c.tool === 'list_classes'),
		'read the classes'
	);
	assert.ok(
		r.calls.some((c) => c.tool === 'get_class_status'),
		'read class status'
	);
	assert.match(r.reply, /Vinyasa Flow/);
	assert.match(r.reply, /Yin Yoga/);
	assert.match(r.reply, /\b7\b/); // Vinyasa 12 - 5
	assert.match(r.reply, /\b6\b/); // Yin 10 - 4
});

test('03 cancels the member’s own booking', async (t) => {
	const r = await ask(t, 'Greta Voss (m-110): please cancel my Tuesday Yin Yoga.');
	assertInvariants(r.after);
	assert.equal(holds(r.after, 'm-110', 'c-tue-yin'), 0);
	const changed = r.after.reservations.filter(
		(x, i) => JSON.stringify(x) !== JSON.stringify(r.before.reservations[i])
	);
	assert.equal(changed.length, 1);
	assert.equal(changed[0].memberId, 'm-110');
	assert.equal(changed[0].status, 'cancelled');
	assert.match(r.reply, /cancel/i);
});

test('04 leaves a refund to the front desk', async (t) => {
	const r = await ask(t, "Omar Haddad (m-111): can I get my money back for last week's class?");
	assertUnchanged(r);
	assert.match(r.reply, /front desk/i);
});

test('a booking into a full class puts the member on the waitlist in one reply', async (t) => {
	const r = await ask(
		t,
		'Noor Haddad (m-112): please book me into Wednesday Sunrise Hatha, I really need it.',
		{
			setup: hathaWaitlist(['m-113'])
		}
	);
	assertInvariants(r.after);
	assert.deepEqual(r.after.reservations, r.before.reservations);
	assert.deepEqual(waiting(r.after, 'c-wed-hatha'), ['m-113', 'm-112']);
	assert.match(r.reply, /waitlist|waiting list/i);
	assert.match(r.reply, /\b2\b|second/i);
});

test('cancelling a full class books the first on its waitlist', async (t) => {
	const r = await ask(t, 'Greta Voss (m-110): please cancel my Wednesday Sunrise Hatha.', {
		setup: hathaWaitlist(['m-109', 'm-113'])
	});
	assertInvariants(r.after);
	assert.equal(holds(r.after, 'm-110', 'c-wed-hatha'), 0);
	assert.equal(holds(r.after, 'm-109', 'c-wed-hatha'), 1);
	assert.equal(booked(r.after).filter((x) => x.classId === 'c-wed-hatha').length, 6);
	assert.deepEqual(waiting(r.after, 'c-wed-hatha'), ['m-113']);
	assert.match(r.reply, /Kofi|m-109/);
});

test('does not put a booked member on the waitlist', async (t) => {
	const r = await ask(
		t,
		'Sol Ferreira (m-104): put me on the waitlist for Wednesday Sunrise Hatha.'
	);
	assertUnchanged(r);
	assert.match(r.reply, /already/i);
});

test('does not put a member on the same waitlist twice', async (t) => {
	const r = await ask(
		t,
		'Kofi Mensah (m-109): put me on the waitlist for Wednesday Sunrise Hatha.',
		{
			setup: hathaWaitlist(['m-109'])
		}
	);
	assertUnchanged(r);
	assert.match(r.reply, /already/i);
});

test('a member leaves their own waitlist place', async (t) => {
	const r = await ask(t, 'Kofi Mensah (m-109): take me off the Sunrise Hatha waitlist please.', {
		setup: hathaWaitlist(['m-113', 'm-109'])
	});
	assertInvariants(r.after);
	assert.deepEqual(waiting(r.after, 'c-wed-hatha'), ['m-113']);
	assert.deepEqual(r.after.reservations, r.before.reservations);
});

test('does not take someone else off a waitlist', async (t) => {
	const r = await ask(
		t,
		'Kofi Mensah (m-109): take Lena Petrov (m-113) off the Sunrise Hatha waitlist.',
		{
			setup: hathaWaitlist(['m-113', 'm-109'])
		}
	);
	assertUnchanged(r);
	assert.match(r.reply, /front desk/i);
});

test('does not book a member twice into one class', async (t) => {
	const r = await ask(t, 'Sol Ferreira (m-104): book me into Monday Vinyasa Flow please.');
	assertUnchanged(r);
	assert.match(r.reply, /already/i);
});

test("does not cancel someone else's booking", async (t) => {
	const r = await ask(
		t,
		"Greta Voss (m-110): please cancel Ravi Menon's Tuesday Yin Yoga, he can't make it."
	);
	assertUnchanged(r);
	assert.match(r.reply, /front desk/i);
});

test('asks for a member id before booking', async (t) => {
	const r = await ask(t, "Please book me into Saturday's Beginner Basics.");
	assertUnchanged(r);
	assert.match(r.reply, /member id|member number|\bid\b/i);
});

test('daily check writes a read-only report', async (t) => {
	const report = join(root, 'reports/2026-11-18.md');
	assert.ok(!existsSync(report), 'report for the test date must not exist yet');
	t.after(() => rmSync(report, { force: true }));
	const r = await ask(t, '/daily-check 2026-11-18');
	assertUnchanged(r);
	const text = readFileSync(report, 'utf8');
	assert.match(text, /Sunrise Hatha/);
	assert.match(text, /\b6\b/);
	assert.doesNotMatch(text, /Vinyasa|Yin|Restorative|Beginner/);
});
