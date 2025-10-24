#!/bin/bash
output=$(npx -y mcp-thorns@latest 2>&1)
context=$(printf '%s' "$output" | jq -Rs .)
printf '{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":%s}}' "$context"
