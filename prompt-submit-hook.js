#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
const projectDir = process.env.CLAUDE_PROJECT_DIR;
try {
  let outputs = [];

  // 1. Read ./start.md
  const startMdPath = path.join(pluginRoot, 'start.md');
  const startMdContent = fs.readFileSync(startMdPath, 'utf-8');
  outputs.push(`=== start.md ===\n${startMdContent}`);

  // 2. Run mcp-thorns@latest
  try {
    const thornOutput = execSync('npx -y mcp-thorns@latest', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: projectDir 
    });
    outputs.push(`=== mcp-thorns@latest ===\n${thornOutput}`);
  } catch (e) {
    outputs.push(`=== mcp-thorns@latest ===\nError: ${e.message}`);
  }

  // 3. Run wfgy@latest hook
  try {
    const wfgyOutput = execSync('npx -y wfgy@latest hook', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: projectDir 
    });
    outputs.push(`=== wfgy@latest hook ===\n${wfgyOutput}`);
  } catch (e) {
    outputs.push(`=== wfgy@latest hook ===\nError: ${e.message}`);
  }

  const additionalContext = outputs.join('\n\n');

  const result = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext
    }
  };

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: `Error executing hook: ${error.message}`
    }
  }, null, 2));
  process.exit(1);
}
