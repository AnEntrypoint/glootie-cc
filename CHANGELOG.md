# CHANGELOG

## [2.0.6] - 2025-11-14

### Fixes
- Fixed AbortError in child_process by adding proper timeout configurations
- Added MCP server timeout values to .mcp.json (glootie: 6min, playwright: 6min, vexify: 6min)
- Added 6min timeout to npx commands in prompt-submit-hook.js with graceful error handling
- Improved error messages for timeout scenarios to avoid cryptic AbortError

### Configuration
- Added killSignal: 'SIGTERM' to execSync calls for clean process termination
- Better timeout error detection and reporting in hook scripts
- All timeouts set to 360000ms (6 minutes) for reliability

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
