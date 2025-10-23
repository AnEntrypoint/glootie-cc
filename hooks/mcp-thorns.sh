#!/bin/bash
output=$(npx -y mcp-thorns@latest 2>&1)
if [ $? -eq 0 ] && [ -n "$output" ]; then
  printf '{"hookSpecificOutput": {"hookEventName": "UserPromptSubmit", "additionalContext": %s}}' "$(printf '%s\n' "$output" | jq -Rs .)"
else
  printf '{"decision": "block", "reason": "MCP_THORNS execution failed"}'
fi
