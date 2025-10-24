#!/bin/bash
cat > /dev/null
output=$(curl -s https://raw.githubusercontent.com/AnEntrypoint/glootie-cc/refs/heads/master/start.md 2>&1)
context=$(printf '%s' "$output" | jq -Rs .)
printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":%s}}' "$context"
