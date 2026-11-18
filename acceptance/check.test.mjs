// Checks the pass rules themselves: an agent that does nothing passes only the tasks
// where nothing should change, and the intended outcome passes every task.
//   node --test acceptance/check.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { judge, prepare, tasks } from './check.mjs';

const seed = JSON.parse(readFileSync(new URL('studio.json', import.meta.url), 'utf8'));
const start = (taskId) => prepare(taskId, seed);

const book = (studio, memberId, classId) => ({
	...studio,
	reservations: [
		...studio.reservations,
		{ id: `r-${studio.reservations.length + 1}`, classId, memberId, status: 'booked' }
	]
});
const cancel = (studio, memberId, classId) => ({
	...studio,
	reservations: studio.reservations.map((r) =>
		r.memberId === memberId && r.classId === classId && r.status === 'booked'
			? { ...r, status: 'cancelled' }
			: r
	)
});
const waitlist = (studio, classId, memberIds) => ({
	...studio,
	waitlist: memberIds.map((memberId) => ({ classId, memberId }))
});

const intended = {
	'a1-simple-booking': (s) => book(s, 'm-107', 'c-tue-yin'),
	'a2-full-class': (s) => s,
	'a3-double-booking': (s) => s,
	'a4-last-place': (s) => book(s, 'm-115', 'c-thu-restorative'),
	'a5-move': (s) => book(cancel(s, 'm-109', 'c-mon-vinyasa'), 'm-109', 'c-sat-basics'),
	'w1-join-full': (s) => waitlist(s, 'c-wed-hatha', ['m-112']),
	'w2-promote': (s) =>
		waitlist(book(cancel(s, 'm-110', 'c-wed-hatha'), 'm-112', 'c-wed-hatha'), 'c-wed-hatha', [
			'm-113'
		]),
	'w3-no-duplicate': (s) => s
};

test('every task has its intended outcome', () => {
	assert.deepEqual(Object.keys(intended), Object.keys(tasks));
});

for (const [taskId, outcome] of Object.entries(intended)) {
	test(`${taskId} passes on its intended outcome`, () => {
		assert.deepEqual(judge(taskId, start(taskId), outcome(start(taskId))), []);
	});
}

test('doing nothing passes only where nothing should change', () => {
	const passing = Object.keys(tasks).filter((t) => judge(t, start(t), start(t)).length === 0);
	assert.deepEqual(passing, ['a2-full-class', 'a3-double-booking', 'w3-no-duplicate']);
});

test('a booking into the full class fails a2 on capacity', () => {
	const after = book(start('a2-full-class'), 'm-112', 'c-wed-hatha');
	assert.match(judge('a2-full-class', start('a2-full-class'), after).join(), /holds 7 of 6/);
});

test('a second place for the same member fails a3', () => {
	const after = book(start('a3-double-booking'), 'm-103', 'c-mon-vinyasa');
	assert.match(judge('a3-double-booking', start('a3-double-booking'), after).join(), /twice/);
});

test('booking both last-place requests fails a4', () => {
	const after = book(
		book(start('a4-last-place'), 'm-115', 'c-thu-restorative'),
		'm-118',
		'c-thu-restorative'
	);
	assert.notDeepEqual(judge('a4-last-place', start('a4-last-place'), after), []);
});

test('a waitlist joined twice fails w3', () => {
	const after = waitlist(start('w3-no-duplicate'), 'c-wed-hatha', ['m-112', 'm-112']);
	assert.match(judge('w3-no-duplicate', start('w3-no-duplicate'), after).join(), /waitlist/);
});
