# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**glootie-cc** is an advanced Claude Code plugin that integrates MCP (Model Context Protocol) tools, WFGY workflow automation, and automated hooks for enhanced development productivity. It bundles three MCP servers and provides comprehensive automation for Claude Code sessions.

**Version:** 2.0.4
**Repository:** https://github.com/AnEntrypoint/glootie-cc
**Type:** Node.js npm package

## Architecture

### Plugin Structure
- **prompt-submit-hook.js** - SessionStart hook that loads workflow context and WFGY integration
- **stop-hook.js** - Stop hook that provides session cleanup (currently minimal no-op to avoid timeouts)
- **hooks/hooks.json** - Hook configuration mapping
- **start.md** - Mandatory dev workflow rules and absolute requirements
- **.mcp.json** - MCP server definitions for bundled tools
- **package.json** - npm package metadata

### Bundled MCP Servers
1. **glootie** - Code execution and testing (`mcp-glootie@latest`)
2. **playwright** - Browser automation (`@playwright/mcp@latest`)
3. **vexify** - Code search and AST analysis (`vexify@latest`)

### Hook System
- **SessionStart**: Runs `prompt-submit-hook.js` to load start.md and initialize WFGY context
- **Stop**: Runs `stop-hook.js` (minimal cleanup)

## Development Commands

```bash
npm install              # Install dependencies
npm view glootie-cc      # Check npm registry info
git status               # Check working directory status
git push                 # Push changes to remote
```

## Workflow Rules (from start.md)

These are mandatory requirements enforced in all work:

### File Management
- Maintain permanent structure only - no temp/mock/simulation files
- Single primary implementation - zero failovers/fallbacks
- Hard 200-line limit per file - split immediately if exceeded
- Delete all non-essential files (keep only CHANGELOG.md, CLAUDE.md, README.md, TODO.md)
- No report files or comments

### Code Quality
- Errors must fail with clear logs, never hide through fallbacks
- All code must be dynamic/modular with ground truth values (no hardcoded values)
- DRY architecture - resolve duplicate code immediately
- Keep code concise and functional

### Testing & Validation
- Manual testing only - no test files
- Use glootie MCP and playwright MCP for execution and debugging
- Troubleshoot via execution before editing files
- Hypothesize and verify through live execution

### Session Management
- TODO.md must be completely cleared before stopping (no items remaining)
- CLAUDE.md tracks technical info in realtime
- CHANGELOG.md captures concise change summaries
- Logs should be kept <4KB ideal, max 30KB

## Key Technical Notes

### Timeout Configuration
**MCP Server Timeouts**: All three MCP servers have explicit timeout values in .mcp.json:
- glootie: 360000ms (6min)
- playwright: 360000ms (6min)
- vexify: 360000ms (6min)

**Hook Script Execution**: prompt-submit-hook.js uses bundled mcp-thorns and wfgy (direct node invocation, no npx). Timeout: 180000ms (3min) per command with SIGTERM killSignal. If tools timeout/error, they are gracefully skipped. Hook completes in ~50s typical, ~6min worst case.

**Project-Level Configuration**: Projects can set MCP_TIMEOUT and MCP_TOOL_TIMEOUT in .claude/settings.json env section. Example values: MCP_TIMEOUT: 360000ms, MCP_TOOL_TIMEOUT: 360000ms.

**Stop Hook**: The stop-hook was simplified to a minimal no-op after experiencing ETIMEDOUT errors. Previous iterations that attempted git checks, npm lookups, or subprocess execution caused timeouts in the Claude Code hook framework. The current implementation exits immediately to avoid blocking session stops.

### Hook Output Format
- SessionStart hook outputs JSON with `hookSpecificOutput` containing `hookEventName` and `additionalContext`
- Stop hook should output nothing (silent pass) unless blocking - outputs `{decision: "block", reason: "..."}` if blocking is needed
- All hooks must handle errors gracefully and avoid process crashes

### Important: Never Run eval.js Manually
The eval.js file runs automatically at the end of processes - never invoke it manually.

## Available Tools
Through the bundled MCP servers and Claude Code:
- **Execution**: glootie execute, bash, nodejs, deno
- **Browser**: playwright for DOM manipulation, navigation, snapshots
- **Search**: vexify for code search and AST analysis
- **File ops**: Read, Write, Edit, Glob, Grep
- **Automation**: Task tool for complex workflows

## Publishing & Deployment

The package is published to npm as `glootie-cc`:
```bash
npm publish              # Publish current version to npm
```

Update version in package.json before publishing. Main entry point is `.claude-plugin/plugin.json`.

## Testing Context Sessions

The plugin is tested with DocStudio E2E evaluation suite. The suite runs 14 tests covering auth, marketplace, documents, chat, and tools. Session Stop should pass silently without blocking.

## Git Workflow

Recent work has focused on fixing the stop-hook timeout issues:
- Removed shell mode git commands that caused ETIMEDOUT
- Removed npm registry lookups that could hang
- Simplified to minimal no-op to ensure hook completes quickly

Check git history for regression troubleshooting - always use differential comparisons and manual edits rather than reverts.

## Performance Optimization

### MCP Startup via Direct Node Invocation
Eliminated npx overhead by bundling MCP packages directly. All three MCP servers now invoke node directly against local binaries:

- **glootie**: `node ${CLAUDE_PLUGIN_ROOT}/node_modules/mcp-glootie/src/index.js`
- **playwright**: `node ${CLAUDE_PLUGIN_ROOT}/node_modules/@playwright/mcp/cli.js`
- **vexify**: `node ${CLAUDE_PLUGIN_ROOT}/node_modules/vexify/lib/bin/cli.js mcp`

**Benefits**:
- Zero npx startup overhead (no npm registry queries)
- Instant binary resolution (no package resolution phase)
- All packages included in npm distribution
- Single `npm install` provides complete setup
- **MCP works correctly in any folder** - uses ${CLAUDE_PLUGIN_ROOT} environment variable expansion

**Performance Impact**:
- Previous approach: ~30-60s (first run, npx overhead + download) → ~3-8s (cached)
- Current approach: ~100-200ms (direct node invocation, zero overhead)
- Improvement: **150-600x faster startup**

### MCP Path Resolution Fix
Previous versions used relative paths (`./node_modules/...`) which broke when plugin was used in different folders. Now uses `${CLAUDE_PLUGIN_ROOT}` environment variable that Claude Code expands to the actual plugin directory, ensuring MCP servers work correctly regardless of where the plugin is instantiated. This is the documented standard for plugin-relative paths in Claude Code MCP configurations.
