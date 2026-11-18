// Writes a task's starting state, from the studio data held back here, and prints its message.
//   node reset.mjs <task> <start.json>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { prepare, tasks } from './check.mjs';

const [taskId, outPath] = process.argv.slice(2);
if (!tasks[taskId] || !outPath) {
	console.error(`usage: reset.mjs <${Object.keys(tasks).join('|')}> <start.json>`);
	process.exit(2);
}
const seed = JSON.parse(readFileSync(new URL('studio.json', import.meta.url), 'utf8'));
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(prepare(taskId, seed), null, 2)}\n`);
console.log(tasks[taskId].request);
