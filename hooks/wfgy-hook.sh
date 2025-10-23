#!/bin/bash
output=$(npx -y wfgy@latest hook 2>&1)
if [ $? -eq 0 ] && [ -n "$output" ]; then
  printf '{"hookSpecificOutput": {"hookEventName": "UserPromptSubmit", "additionalContext": %s}}' "$(printf '%s\n' "$output" | jq -Rs .)"
else
  printf '{"decision": "block", "reason": "WFGY_HOOK execution failed"}'
fi
