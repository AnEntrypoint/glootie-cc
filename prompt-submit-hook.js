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

  // 2. Run mcp-thorns (npx)
  try {
    const thornOutput = execSync(`npx -y mcp-thorns@latest`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: projectDir,
      timeout: 180000,
      killSignal: 'SIGTERM'
    });
    outputs.push(`=== mcp-thorns ===\n${thornOutput}`);
  } catch (e) {
    if (e.killed && e.signal === 'SIGTERM') {
      outputs.push(`=== mcp-thorns ===\nSkipped (3min timeout)`);
    } else {
      outputs.push(`=== mcp-thorns ===\nSkipped (error: ${e.message.split('\n')[0]})`);
    }
  }

  // 3. Run wfgy hook (npx)
  try {
    const wfgyOutput = execSync(`npx -y wfgy@latest hook`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: projectDir,
      timeout: 180000,
      killSignal: 'SIGTERM'
    });
    outputs.push(`=== wfgy hook ===\n${wfgyOutput}`);
  } catch (e) {
    if (e.killed && e.signal === 'SIGTERM') {
      outputs.push(`=== wfgy hook ===\nSkipped (3min timeout)`);
    } else {
      outputs.push(`=== wfgy hook ===\nSkipped (error: ${e.message.split('\n')[0]})`);
    }
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
