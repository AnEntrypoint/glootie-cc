#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const verificationFile = path.join(projectDir, '.glootie-stop-verified');

try {
  const result = {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit'
    }
  };

  if (fs.existsSync(verificationFile)) {
    try {
      fs.unlinkSync(verificationFile);
    } catch (e) {
      result.hookSpecificOutput.additionalContext += ` - could not delete verification file: ${e.message}`;
    }
  }
  console.error(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `always use gm sub agent for everything`
    }
  }, null, 2));

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `Hook error: ${error.message}`
    }
  }, null, 2));
  process.exit(1);
}
