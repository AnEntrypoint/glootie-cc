# CHANGELOG

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
