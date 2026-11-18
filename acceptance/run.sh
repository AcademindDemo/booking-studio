#!/bin/sh
# Runs acceptance tasks against the built agent: each task on a fresh copy of the studio data,
# through `claude -p` in the agent's folder, then judges the state it left.
#   sh acceptance/run.sh [agent-folder] [tasks] [runs-per-task]
# Defaults: ../booking-studio beside this folder, a1 to a5, two runs each.
# Output: acceptance/runs/<time>/summary.txt, and per run start.json, final.json, calls.jsonl and trace.txt.
set -u
kit=$(cd "$(dirname "$0")" && pwd)
agent=$(cd "${1:-$kit/../booking-studio}" && pwd)
tasks=${2:-"a1-simple-booking a2-full-class a3-double-booking a4-last-place a5-move"}
repeats=${3:-2}
out=$kit/runs/$(date +%Y%m%d-%H%M%S)
mkdir -p "$out"
failed=0
for task in $tasks; do
	n=1
	while [ "$n" -le "$repeats" ]; do
		dir=$out/$task-$n
		mkdir -p "$dir"
		request=$(node "$kit/reset.mjs" "$task" "$dir/start.json") || exit 2
		cp "$dir/start.json" "$dir/final.json"
		(cd "$agent" && BOOKING_DATA=$dir/final.json BOOKING_CALLS=$dir/calls.jsonl \
			claude -p --permission-mode dontAsk --output-format stream-json --verbose "$request" \
			>"$dir/trace.jsonl" 2>"$dir/stderr.txt")
		node "$kit/trace.mjs" "$dir/trace.jsonl" >"$dir/trace.txt"
		verdict=$(node "$kit/check.mjs" "$task" "$dir/start.json" "$dir/final.json") || failed=1
		echo "$task run $n: $verdict" | tee -a "$out/summary.txt"
		n=$((n + 1))
	done
done
echo "Runs and traces: $out"
exit "$failed"
