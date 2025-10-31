#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

const run = () => {
  let blockReasons = [];

  try {
    const ahead = execSync('git', ['rev-list', '--count', 'origin/HEAD..HEAD'], {
      encoding: 'utf-8',
      cwd: projectDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 2000
    }).trim();

    if (parseInt(ahead) > 0) {
      blockReasons.push(`Git: ${ahead} commit(s) ahead of origin/HEAD, must push to remote`);
    }
  } catch (e) {
  }

  try {
    const behind = execSync('git', ['rev-list', '--count', 'HEAD..origin/HEAD'], {
      encoding: 'utf-8',
      cwd: projectDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 2000
    }).trim();

    if (parseInt(behind) > 0) {
      blockReasons.push(`Git: ${behind} commit(s) behind origin/HEAD, must merge from remote`);
    }
  } catch (e) {
  }

  if (blockReasons.length > 0) {
    return {
      decision: "block",
      reason: blockReasons.join(' | ')
    };
  }

  const evalJsPath = path.join(projectDir, 'eval.js');

  if (fs.existsSync(evalJsPath)) {
    try {
      execSync('./eval.js', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: projectDir,
        timeout: 60000
      });
    } catch (e) {
      const errorOutput = e.stdout || '';
      const errorStderr = e.stderr || '';
      const fullError = `Error: ${e.message}\n\nStdout:\n${errorOutput}\n\nStderr:\n${errorStderr}`;
      return {
        decision: "block",
        reason: `The following errors were reported: ${fullError}`
      };
    }
  }

  return { decision: undefined };
};

try {
  const result = run();
  if (result.decision === 'block') {
    console.log(JSON.stringify({ decision: result.decision, reason: result.reason }));
  }
} catch (e) {
}
