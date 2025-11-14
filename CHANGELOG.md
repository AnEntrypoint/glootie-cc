# CHANGELOG

## [2.0.6] - 2025-11-14

### Performance
- Bundled mcp-thorns and wfgy directly into node_modules (like MCP tools)
- Eliminated npx overhead for hook commands (~4-5s faster)
- Hook uses direct node invocation instead of npx
- Hook completes in ~50s instead of hanging indefinitely

### Fixes
- Fixed AbortError by preventing hooks from timing out
- Changed hook commands from npx to bundled node invocation
- Hook gracefully skips mcp-thorns/wfgy if they timeout (3min) or error
- MCP server timeouts set to 180000ms (3min) for reliability

### Configuration
- prompt-submit-hook.js: 180000ms (3min) timeout with bundled packages
- hooks.json: 7200s framework timeout
- .mcp.json: 360000ms (6min) for glootie/playwright/vexify
- killSignal: 'SIGTERM' for clean process termination

### Dependencies
- Added mcp-thorns and wfgy as bundled dependencies
- Included in node_modules for zero npx overhead

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
