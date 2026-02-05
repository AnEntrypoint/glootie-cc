# glootie-cc for Claude Code

## Installation

Install glootie-cc into your project to add the gm state machine and hooks:

```bash
cd /path/to/your/project
npm install glootie-cc
```

This installs the following files to your project root:

```
project/
├── agents/
│   └── gm.md
├── hooks/
│   ├── pre-tool-use-hook.js
│   ├── session-start-hook.js
│   ├── prompt-submit-hook.js
│   ├── stop-hook.js
│   └── stop-hook-git.js
└── .mcp.json
```

### Using in Claude Code

Add one line to your project settings:

```json
{
  "plugins": ["./"]
}
```

Claude Code now reads agents/gm.md, hooks/, and .mcp.json from your project root.

## Update

```bash
npm update glootie-cc
```

## Features

- State machine agent with exhaustive behavioral rules
- Five enforcement hooks (validation, prompts, startup, completion, git)
- MCP integration for code execution and search
- Automatic thorns AST analysis at session start
- .prd completion enforcement at session end
