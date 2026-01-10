#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const verificationFile = path.join(projectDir, '.glootie-stop-verified');

try {
  const result = {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: 'Glootie execution cycle proceeding'
    }
  };

  // Delete the verification file if it exists
  if (fs.existsSync(verificationFile)) {
    try {
      fs.unlinkSync(verificationFile);
      result.hookSpecificOutput.additionalContext += ' - verification file cleaned up';
    } catch (e) {
      result.hookSpecificOutput.additionalContext += ` - could not delete verification file: ${e.message}`;
    }
  }

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
