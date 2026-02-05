# glootie-cc for Claude Code

## Installation (Standalone Mode)

Install glootie-cc into your project to add the gm state machine and hooks:

```bash
cd /path/to/your/project
npm install glootie-cc
```

The postinstall script automatically copies files to your project's `.claude/` directory:

```
project/
├── node_modules/glootie-cc/
└── .claude/
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

Claude Code automatically discovers and reads from the `.claude/` directory without any configuration needed.

## Update

```bash
npm update glootie-cc
```

The postinstall script runs again and updates all files in `.claude/`.

## Features

- State machine agent with exhaustive behavioral rules
- Five enforcement hooks (validation, prompts, startup, completion, git)
- MCP integration for code execution and search
- Automatic thorns AST analysis at session start
- .prd completion enforcement at session end
- Automatic .claude/ directory setup via postinstall
