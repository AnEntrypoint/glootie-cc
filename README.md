tl/dr: 
```
claude plugin marketplace install -s user AnEntrypoint/glootie-cc
claude plugin add g

To get the 'full effect' right now, we recommend either of two approaches (add it to your prompt):
for swarm:
use glootie sub agents in parallel for everyhing
for task:
use glootie sub agents for everything
for serial:
use glootie for everything
```

we're working on discovering the best approach to automatic use of this, and use glootie for everything is already included as a system prompt, however prompting it does appear to help right now

the plugin marketplace will appear as 'env'... the idea is that env is more token friendly
the mcp tools will appear under the 'g' plugin
plugin:g:dev is how it will now execute all things, giving a controllable environment for execution, currently the recommended way to add client side coding abilities to this tool is playwriter:
https://github.com/remorses/playwriter

what glootie does is it enacts a system policy as a virtual state machine that the LLM then has to try and emulate, enforces the use of code execution instead of file edit and run loops, 

<img width="225" height="325" alt="image" src="https://github.com/user-attachments/assets/c20abd6c-5e5a-427d-a4fb-b6bd6736d0c6" />

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


<!-- Final verification test: Hook allows clean README changes -->

<!-- Test comment: 1768159686 -->
