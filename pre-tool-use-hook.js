#!/usr/bin/env node

const fs = require('fs');

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
        permissionDecisionReason: 'Use mcp__glootie__execute instead for all command execution'
      };
    }

    if (tool_name === 'Glob' || tool_name === 'Grep' || tool_name === 'Search') {
      return {
        permissionDecision: 'deny',
        permissionDecisionReason: `Use glootie code execution over MCP instead: For codebase search, use mcp code-search`
      };
    }

    if (tool_name === 'Task') {
      const subagentType = tool_input?.subagent_type || '';
      if (subagentType === 'Explore') {
        return {
          permissionDecision: 'deny',
          permissionDecisionReason: 'Use mcp__glootie__execute for code execution. For codebase exploration, use mcp code-search multiple times'
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
