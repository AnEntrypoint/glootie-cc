#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

let outputs = [];
let blockReasons = [];

try {
  const ahead = execSync('git rev-list --count origin/HEAD..HEAD', {
    encoding: 'utf-8',
    cwd: projectDir,
    stdio: ['pipe', 'pipe', 'pipe']
  }).trim();

  const behind = execSync('git rev-list --count HEAD..origin/HEAD', {
    encoding: 'utf-8',
    cwd: projectDir,
    stdio: ['pipe', 'pipe', 'pipe']
  }).trim();

  if (parseInt(ahead) > 0) {
    blockReasons.push(`Git: ${ahead} commit(s) ahead of origin/HEAD, must push to remote`);
  }
  if (parseInt(behind) > 0) {
    blockReasons.push(`Git: ${behind} commit(s) behind origin/HEAD, must merge from remote`);
  }
} catch (e) {
}

try {
  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const pkgName = pkg.name;
    const pkgVersion = pkg.version;

    if (pkgName) {
      try {
        const npmVersion = execSync(`npm view ${pkgName} version`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        }).trim();

        const parseVersion = (v) => {
          const parts = v.split('.').map(p => parseInt(p) || 0);
          return parts;
        };

        const local = parseVersion(pkgVersion);
        const remote = parseVersion(npmVersion);

        let codebaseNewer = false;
        for (let i = 0; i < Math.max(local.length, remote.length); i++) {
          const l = local[i] || 0;
          const r = remote[i] || 0;
          if (l > r) {
            codebaseNewer = true;
            break;
          } else if (l < r) {
            break;
          }
        }

        if (codebaseNewer) {
          blockReasons.push(`NPM: Codebase version ${pkgVersion} is newer than published ${npmVersion}, must publish`);
        }
      } catch (e) {
      }
    }
  }
} catch (e) {
}

if (blockReasons.length > 0) {
  console.log(JSON.stringify({
    decision: "block",
    reason: blockReasons.join(' | ')
  }, null, 2));
  process.exit(0);
}

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
