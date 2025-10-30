#!/usr/bin/env node 

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process'); 

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
const projectDir = process.env.CLAUDE_PROJECT_DIR; 

try {
  let outputs = []; 

  // Check if ./eval.js exists in project directory
  const evalJsPath = path.join(projectDir, 'eval.js'); 

  if (fs.existsSync(evalJsPath)) {
    // Run ./eval.js in project directory
    try {
      const evalOutput = execSync('./eval.js', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: projectDir 
      });
      outputs.push(=== eval.js ===\n${evalOutput});
    } catch (e) {
      // Capture both stdout and stderr
      const errorOutput = e.stdout || '';
      const errorStderr = e.stderr || '';
      const fullError = Error: ${e.message}\n\nStdout:\n${errorOutput}\n\nStderr:\n${errorStderr}; 
  // If there's an error, we need to block
  console.log(JSON.stringify({
    decision: "block",
    reason: `The following errors were reported: ${fullError}`
  }, null, 2));
  process.exit(1);
}

  } else {
    // eval.js doesn't exist, skip without sending block
    // Exit without any output that would be interpreted as a block
    process.exit(0);
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
  // If there's an error, we need to block
  console.log(JSON.stringify({
    decision: "block",
    reason: The following errors were reported: ${error.message}
  }, null, 2));
  process.exit(1);
} 
