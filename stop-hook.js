#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

let outputs = [];
const evalJsPath = path.join(projectDir, 'eval.js');

if (fs.existsSync(evalJsPath)) {
  try {
    const evalOutput = execSync('./eval.js', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: projectDir
    });
    outputs.push(`=== eval.js ===\n${evalOutput}`);
  } catch (e) {
    const errorOutput = e.stdout || '';
    const errorStderr = e.stderr || '';
    const fullError = `Error: ${e.message}\n\nStdout:\n${errorOutput}\n\nStderr:\n${errorStderr}`;
    console.log(JSON.stringify({
      decision: "block",
      reason: `The following errors were reported: ${fullError}`
    }, null, 2));
    process.exit(0);
  }
}

const additionalContext = outputs.join('\n\n');

const result = {
  hookSpecificOutput: {
    hookEventName: 'Stop',
    additionalContext
  }
};

console.log(JSON.stringify(result, null, 2));
process.exit(0);
