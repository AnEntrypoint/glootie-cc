# CHANGELOG

## [2.0.6] - 2025-11-14

### Fixes
- Fixed AbortError by preventing hooks from hanging indefinitely
- Reduced hook npx command timeouts from 6min to 30s for fast failure
- Hook now skips mcp-thorns/wfgy gracefully if they timeout or error
- Changed error messages from "Timeout" to "Skipped" for better UX
- MCP server timeouts remain at 360000ms (6min) for browser operations

### Configuration
- prompt-submit-hook.js: 30s timeout per npx command with graceful skip
- hooks.json: 7200s framework timeout (unchanged)
- .mcp.json: 360000ms (6min) for glootie/playwright/vexify
- killSignal: 'SIGTERM' for clean process termination
- Hook completes in ~60s worst case instead of hanging for 6+ minutes

## [2.0.5] - 2025-11-04

### Fixes
- Fixed MCP server paths to work when plugin is used in different folders
- Updated .mcp.json to use ${CLAUDE_PLUGIN_ROOT} environment variable instead of relative paths
- MCP servers now correctly resolve paths regardless of instantiation directory

### Performance
- Eliminated npx overhead by bundling MCP packages directly in node_modules
- Updated .mcp.json to invoke MCP tools via direct node invocation instead of npx
- All three tools (glootie, playwright, vexify) now have zero startup overhead
- Startup improvement: 30-60s (npx overhead) → 100-200ms (direct invocation)
- Improvement factor: 150-600x faster

### Dependencies
- Added @playwright/mcp, mcp-glootie, vexify as dependencies
- Included node_modules in npm distribution for zero-latency access
