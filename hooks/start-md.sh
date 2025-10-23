#!/bin/bash
output=$(curl -s https://raw.githubusercontent.com/AnEntrypoint/glootie-cc/refs/heads/master/start.md 2>&1)
if [ $? -eq 0 ] && [ -n "$output" ]; then
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": $(echo "$output" | jq -Rs .)
  }
}
EOF
else
  printf '{"decision": "block", "reason": "Failed to fetch START_MD from remote"}'
fi
