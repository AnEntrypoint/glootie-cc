#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
const verificationFile = path.join(projectDir, '.glootie-stop-verified');

let aborted = false;
process.on('SIGTERM', () => { aborted = true; });
process.on('SIGINT', () => { aborted = true; });

const readStopHookInput = () => {
  try {
    const input = fs.readFileSync(0, 'utf-8');
    return JSON.parse(input);
  } catch (e) {
    return {};
  }
};

const readTranscriptEntries = (transcriptPath, count = 5) => {
  try {
    const expandedPath = transcriptPath.replace('~', process.env.HOME || '/root');
    if (!fs.existsSync(expandedPath)) {
      return [];
    }

    const content = fs.readFileSync(expandedPath, 'utf-8');
    const lines = content.trim().split('\n');
    const lastLines = lines.slice(-count);

    return lastLines.map((line, idx) => {
      try {
        return { line: lines.length - count + idx, entry: JSON.parse(line) };
      } catch (e) {
        return { line: lines.length - count + idx, entry: null, parseError: true };
      }
    });
  } catch (e) {
    return [];
  }
};

const run = () => {
  if (aborted) return { decision: undefined };

  try {
    const stopInput = readStopHookInput();
    const transcriptPath = stopInput.transcript_path;
    const stopHookActive = stopInput.stop_hook_active || false;

    if (stopHookActive) {
      return { decision: undefined };
    }

    // Check if verification file exists
    if (fs.existsSync(verificationFile)) {
      // File exists, allow stop to proceed
      return { decision: undefined };
    }

    // File doesn't exist, block stop and instruct agent to verify
    const instruction = `Use glootie code execution to check the last few json entries in the transcript one by one, devise a mechanism to verify that it's finished, and touch the file ${verificationFile} when confirmed.`;

    return {
      decision: 'block',
      reason: `Waiting for transcript verification. ${instruction}`
    };
  } catch (error) {
    return { decision: undefined };
  }
};

try {
  const result = run();
  if (result.decision === 'block') {
    console.log(JSON.stringify({
      decision: result.decision,
      reason: result.reason
    }, null, 2));
  }
} catch (e) {
}
