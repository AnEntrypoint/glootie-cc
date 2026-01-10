#!/usr/bin/env node

/**
 * Stop Hook - Validates transcript integrity and instructions completion
 * Reads transcript from stdin JSON, extracts entries, and blocks if validation needed
 */

const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const inputData = await readStdin();

    if (!inputData) {
      console.log(JSON.stringify({
        reason: 'Hook input empty, allowing stop'
      }));
      process.exit(0);
    }

    let hookInput;
    try {
      hookInput = JSON.parse(inputData);
    } catch (e) {
      console.log(JSON.stringify({
        reason: 'Failed to parse hook input JSON'
      }));
      process.exit(0);
    }

    // Prevent infinite loops if hook already triggered a block
    if (hookInput.stop_hook_active === true) {
      console.log(JSON.stringify({
        reason: 'Stop hook already active, allowing stop'
      }));
      process.exit(0);
    }

    // Extract transcript entries from the input
    const transcriptEntries = hookInput.transcript_entries || [];

    if (!Array.isArray(transcriptEntries) || transcriptEntries.length === 0) {
      console.log(JSON.stringify({
        reason: 'No transcript entries to validate'
      }));
      process.exit(0);
    }

    // Perform critical validation
    const validation = validateTranscriptIntegrity(transcriptEntries);

    if (!validation.isValid) {
      // Critical issues found - block and require validation
      console.log(JSON.stringify({
        decision: 'block',
        reason: validation.reason,
        blockInstruction: {
          action: 'validate_transcript_with_glootie',
          context: {
            lastEntries: extractLastEntries(transcriptEntries, 3),
            validationIssues: validation.issues,
            transcriptLength: transcriptEntries.length
          },
          instructions: buildValidationInstructions(validation.issues, transcriptEntries)
        }
      }));
      process.exit(0);
    }

    // Validation passed - allow stop
    console.log(JSON.stringify({
      reason: 'Transcript validation passed, allowing stop'
    }));
    process.exit(0);

  } catch (error) {
    console.log(JSON.stringify({
      reason: `Unhandled error in stop hook: ${error.message}`
    }));
    process.exit(0);
  }
}

function validateTranscriptIntegrity(entries) {
  const issues = [];

  // Check minimum entry count
  if (!Array.isArray(entries) || entries.length < 1) {
    issues.push('Transcript has no entries');
    return { isValid: false, issues, reason: 'Empty transcript' };
  }

  // Validate each entry structure
  const validTypes = ['summary', 'file-history-snapshot', 'user', 'assistant', 'tool'];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (!entry || typeof entry !== 'object') {
      issues.push(`Entry ${i}: Invalid structure (not an object)`);
      continue;
    }

    if (!entry.type || !validTypes.includes(entry.type)) {
      issues.push(`Entry ${i}: Missing or invalid type field. Expected one of: ${validTypes.join(', ')}`);
    }

    if (!entry.content) {
      issues.push(`Entry ${i}: Missing content field`);
    }
  }

  // Check for work indicators in transcript
  const allContent = entries.map(e => e.content || '').join(' ');
  const hasToolExecutions = entries.some(e => e.type === 'tool' || (e.content && e.content.includes('tool')));
  const hasCodeGeneration = entries.some(e => e.content && (e.content.includes('```') || e.content.includes('Edit') || e.content.includes('Write')));

  if (!hasToolExecutions && !hasCodeGeneration) {
    issues.push('No tool executions or code generation found in transcript');
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      issues,
      reason: `Transcript validation failed: ${issues.length} critical issue(s) found`
    };
  }

  return { isValid: true, issues: [] };
}

function extractLastEntries(entries, count) {
  // Extract the last N entries with full context
  const lastEntries = entries.slice(-count).map(entry => ({
    type: entry.type,
    content: typeof entry.content === 'string' ? entry.content.slice(0, 500) : entry.content,
    timestamp: entry.timestamp
  }));

  return lastEntries;
}

function buildValidationInstructions(issues, allEntries) {
  // Build critical instructions for Claude to validate
  const instructionParts = [
    'CRITICAL VALIDATION REQUIRED - Use glootie and playwright to verify:',
    '',
    '1. TRANSCRIPT INTEGRITY:',
    `   - Verify all ${allEntries.length} transcript entries are properly structured`,
    '   - Confirm each entry has valid type and non-empty content',
    '',
    '2. ISSUES FOUND (BE VERY CRITICAL):',
    ...issues.map(issue => `   - ${issue}`),
    '',
    '3. WORK VERIFICATION (Use glootie subagent):',
    '   - Verify code changes were actually implemented (glootie execute)',
    '   - Confirm all tool operations completed successfully',
    '   - Check file modifications match the intended changes',
    '',
    '4. PLAYWRITER CONFIRMATION:',
    '   - If UI/browser changes: use playwriter to visually verify',
    '   - Confirm state changes are observable in the application',
    '',
    '5. FINAL DECISION:',
    '   - ONLY touch the verification file if you are 100% confident work is correct',
    '   - DO NOT guess or make assumptions about completion',
    '   - If ANY doubt exists, block and require explicit confirmation'
  ];

  return instructionParts.join('\n');
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data);
    });

    process.stdin.on('error', () => {
      resolve('');
    });

    // Timeout after 2 seconds
    setTimeout(() => {
      if (!data) {
        resolve('');
      }
    }, 2000);
  });
}

main().catch(error => {
  console.log(JSON.stringify({
    reason: `Fatal error: ${error.message}`
  }));
  process.exit(0);
});
