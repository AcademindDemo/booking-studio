import { readFileSync } from 'node:fs';

const lines = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean);
for (const line of lines) {
	const event = JSON.parse(line);
	const blocks = event.message?.content;
	if (event.type === 'assistant' && Array.isArray(blocks)) {
		for (const block of blocks) {
			if (block.type === 'tool_use')
				console.log(`CALL ${block.name} ${JSON.stringify(block.input)}`);
			if (block.type === 'text') console.log(`SAY ${block.text}`);
		}
	}
	if (event.type === 'user' && Array.isArray(blocks)) {
		for (const block of blocks) {
			if (block.type === 'tool_result')
				console.log(`RESULT ${JSON.stringify(block.content).slice(0, 400)}`);
		}
	}
	if (event.type === 'result') console.log(`FINAL ${event.subtype} ${event.result ?? ''}`);
}
