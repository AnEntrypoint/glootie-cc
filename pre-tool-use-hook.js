#!/usr/bin/env node

const fs = require('fs');
const path = require('path')
const run = () => {
  try {
    const input = fs.readFileSync(0, 'utf-8');
    const data = JSON.parse(input);
    const { tool_name, tool_input } = data;

    if (!tool_name) {
      return { permissionDecision: 'allow' };
    }

    if (tool_name === 'Bash') {
      return {
        permissionDecision: 'deny',
        permissionDecisionReason: 'Use dev execute instead for all command execution'
      };
    }

    if (tool_name === 'Write') {
      const file_path = tool_input?.file_path || '';
      const file_extension = path.extname(file_path)
      if (file_extension === '.md' || file_extension === '.txt' ) {
      return {
        permissionDecision: 'deny',
        permissionDecisionReason: 'As a coding agent you may not create any new text documents, you may only maintain a continuously reduced technical caveats-only version of CLAUDE.md, and continuously remove anything it doesnt need from that perspective every time you edit it'
      };
    }
    
    if (tool_name === 'Glob' || tool_name === 'Grep' || tool_name === 'Search') {
      return {
        permissionDecision: 'deny',
        permissionDecisionReason: `Use dev execute over MCP using code for direct code exploration instead: For semantic codebase search and exploration, use mcp code-search`
      };
    }

    if (tool_name === 'Task') {
      const subagentType = tool_input?.subagent_type || '';
      if (subagentType === 'Explore') {
        return {
          permissionDecision: 'deny',
          permissionDecisionReason: 'Use dev execute for code execution. For codebase exploration, use mcp code-search multiple times'
        };
      }
      return { permissionDecision: 'allow' };
    }

    return { permissionDecision: 'allow' };
  } catch (error) {
    return { permissionDecision: 'allow' };
  }
};

try {
  const result = run();
  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      ...result
    }
  };
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow'
    }
  }, null, 2));
}


