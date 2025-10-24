#!/bin/bash
cat > /dev/null
output=$(npx -y wfgy@latest hook 2>&1)
context=$(printf '%s' "$output" | jq -Rs .)
printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":%s}}' "$context"
