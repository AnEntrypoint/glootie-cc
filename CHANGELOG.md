# CHANGELOG

## [2.0.5] - 2025-11-04

### Performance
- Optimized MCP server startup by implementing shared persistent npx cache at `/tmp/.npx-cache`
- All three MCP tools (glootie, playwright, vexify) now share package cache, reducing startup latency
- Typical startup improvement: 30-60s → 3-8s (cached runs)
