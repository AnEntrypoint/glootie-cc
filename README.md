tl/dr: claude plugin install -s user AnEntrypoint/glootie-cc

<img width="449" height="650" alt="image" src="https://github.com/user-attachments/assets/c20abd6c-5e5a-427d-a4fb-b6bd6736d0c6" />

# Claude Code Plugin

An advanced Claude Code plugin that provides comprehensive automated workflows, WFGY integration, and bundled MCP tools for enhanced development productivity.
## Installation

1. Copy the plugin files to your desired location
2. Load the plugin in Claude Code settings
3. MCP tools are automatically bundled and available

**Note:** we use gxe as an npx-to-github proxy to start the tools faster and keep them up-to-date, if you ever need to fix an issue with partial installs or something, just delete ~/.gxe and try again

## Features

### Bundled Tools (drastically context-reduced)
- **glootie** - Code execution via `mcp-glootie@latest`
- **thorns** (loaded via hooks)
- **code-search** semantic code search
- **dev-server** specialized npm run dev runner
