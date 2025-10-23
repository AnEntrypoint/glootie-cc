#!/bin/bash
output=$(curl -s https://raw.githubusercontent.com/AnEntrypoint/glootie-cc/refs/heads/master/start.md 2>&1)
if [ $? -eq 0 ] && [ -n "$output" ]; then
  printf '{"hookSpecificOutput": {"hookEventName": "UserPromptSubmit", "additionalContext": %s}}' "$(printf '%s\n' "$output" | jq -Rs .)"
else
  printf '{"decision": "block", "reason": "Failed to fetch START_MD from remote"}'
fi
