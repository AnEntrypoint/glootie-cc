#!/bin/bash
read -r -d '' hook_input
output=$(npx -y wfgy@latest hook 2>&1)
context=$(printf '%s' "$output" | jq -Rs .)
printf '{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":%s}}' "$context"
