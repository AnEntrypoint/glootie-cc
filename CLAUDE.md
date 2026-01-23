# CLAUDE.md - Technical Caveats & Gotchas

## Claude Code Plugin System

### Stop Hook Response Format
- **Blocking Decision**: Use JSON with exit code 0 (not exit code 1)
- Format: `{"decision":"block","reason":"<message>"}`
- Exit code 0 with JSON output takes precedence over exit codes
- Exit code 2 is for simple blocking via stderr (only use if JSON unavailable)
- Multiple Stop hooks execute in sequence; all must allow to proceed

### Stop Hook Context Filtering
- When filtering transcript history, **must use sessionId to isolate current session only**
- Bug pattern: `(!sessionId || entry.sessionId === sessionId)` matches all entries (incorrect)
- Correct pattern: `if (!sessionId) { find latest sessionId from history } then filter with (entry.sessionId === effectiveSessionId)`
- **Critical**: Claude Code stop hook input may not include sessionId; always implement fallback
- Fallback logic: Loop backward through transcript history, find most recent entry for current project, extract its sessionId
- Use derived sessionId to filter transcript entries for current session only
- Without proper fallback, stop hook cannot access recent work context and verification fails
- **Status (Verified 2026-01-23)**: Fallback logic implemented correctly; stop hook successfully extracts context from current session even without sessionId in input

### PreToolUse Hook Blocks
- **Bash tool**: Redirects to `dev execute` (code execution in appropriate language)
- **Write tool**: Blocks `.md` and `.txt` file creation (except `CLAUDE.md` and `readme.md`)
- **Glob/Grep/Search tools**: Redirects to `code-search` MCP or `dev execute`
- Response format: `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny|allow","permissionDecisionReason":"..."}}`

### SessionStart Hook
- Automatically adds `.glootie-stop-verified` to `.gitignore` on every session start
- Runs AST analysis via `mcp-thorns` with 3min timeout
- Injects codebase insight as additional context
- Response format: `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"..."}}`

### UserPromptSubmit Hook
- Deletes `.glootie-stop-verified` marker on each new user input to reset verification state
- Response format: `{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"..."}}`

### Hook Output Format Rules
- **PreToolUse/SessionStart/UserPromptSubmit**: Must use `hookSpecificOutput` wrapper
- **Stop/Stop-git**: Must output `decision` and `reason` (no wrapper)
- Always output to stdout with exit code 0 (except on fatal errors)
- Pretty-printing (null, 2) is optional but keep JSON single-line for efficiency

## Verification File Lifecycle
- Path: `.glootie-stop-verified` (project root)
- Created: When work is verified complete during stop hook
- Deleted: On each new user prompt (via UserPromptSubmit hook)
- Must be in `.gitignore` (auto-added by SessionStart hook)
- Used to prevent re-verification of same work session

## Stop Hook Git Check
- **After verification file created**: Stop hook checks if git working tree is dirty or has unpushed commits
- If dirty or unpushed: Stop hook blocks with instructions to commit and push
- If clean and pushed: Stop hook allows session to stop
- All uncommitted changes or unpushed commits must be handled before stopping
- `git status --porcelain` detects uncommitted changes
- `git rev-list --count @{u}..HEAD` detects unpushed commits
- Pattern: verification + git clean = allow stop; verification + git dirty/unpushed = block
