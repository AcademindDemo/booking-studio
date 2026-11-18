// Starts tools/booking-server.mjs as Claude Code does (stdio) on a copy of data/studio.json
// and checks each tool against its description. Run: npm test
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const dir = mkdtempSync(join(tmpdir(), 'studio-booking-'));
const data = join(dir, 'studio.json');
const calls = join(dir, 'calls.jsonl');
copyFileSync(new URL('../data/studio.json', import.meta.url), data);

const client = new Client({ name: 'booking-server-test', version: '1.0.0' });

before(() =>
	client.connect(
		new StdioClientTransport({
			command: process.execPath,
			args: [new URL('booking-server.mjs', import.meta.url).pathname],
			env: { ...process.env, BOOKING_DATA: data, BOOKING_CALLS: calls }
		})
	)
);
after(async () => {
	await client.close();
	rmSync(dir, { recursive: true });
});

const call = async (name, args = {}) => {
	const result = await client.callTool({ name, arguments: args });
	return { isError: result.isError === true, value: JSON.parse(result.content[0].text) };
};
const studio = () => JSON.parse(readFileSync(data, 'utf8'));

test('lists the five booking tools', async () => {
	const { tools } = await client.listTools();
	assert.deepEqual(tools.map((t) => t.name).sort(), [
		'cancel_reservation',
		'create_reservation',
		'find_member_reservations',
		'get_class_status',
		'list_classes'
	]);
	const readOnly = tools.filter((t) => t.annotations?.readOnlyHint).map((t) => t.name);
	assert.deepEqual(readOnly.sort(), [
		'find_member_reservations',
		'get_class_status',
		'list_classes'
	]);
});

test('list_classes gives capacity but no places taken', async () => {
	const { value } = await call('list_classes');
	assert.equal(value.length, 5);
	assert.deepEqual(Object.keys(value[0]).sort(), ['capacity', 'id', 'name', 'when']);
});

test('get_class_status counts booked places', async () => {
	const { value } = await call('get_class_status', { classId: 'c-wed-hatha' });
	assert.equal(value.capacity, 6);
	assert.equal(value.bookedPlaces, 6);
	assert.ok(value.bookedMembers.includes('m-110'));
});

test('create_reservation writes even into a full class', async () => {
	const { value } = await call('create_reservation', { memberId: 'm-112', classId: 'c-wed-hatha' });
	assert.equal(value.status, 'booked');
	const status = await call('get_class_status', { classId: 'c-wed-hatha' });
	assert.equal(status.value.bookedPlaces, 7);
	assert.ok(studio().reservations.some((r) => r.id === value.id));
});

test('cancel_reservation frees the place', async () => {
	const [own] = (await call('find_member_reservations', { memberId: 'm-112' })).value;
	const { value } = await call('cancel_reservation', { reservationId: own.id });
	assert.equal(value.status, 'cancelled');
	assert.equal((await call('find_member_reservations', { memberId: 'm-112' })).value.length, 0);
});

test('an unknown id is a tool error and writes nothing', async () => {
	const before = readFileSync(data, 'utf8');
	const result = await call('create_reservation', { memberId: 'm-999', classId: 'c-tue-yin' });
	assert.equal(result.isError, true);
	assert.equal(readFileSync(data, 'utf8'), before);
});

test('every call is logged with its arguments and result', async () => {
	const lines = readFileSync(calls, 'utf8').trim().split('\n').map(JSON.parse);
	assert.ok(lines.length >= 6);
	assert.deepEqual(lines[0], { tool: 'list_classes', args: {}, result: studio().classes });
});
