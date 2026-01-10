#!/usr/bin/env node

/**
 * Stop Hook - Validates transcript on session end
 * This hook runs when a session is ending to verify transcript integrity
 */

const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Read transcript entries from stdin
    const inputData = await readStdin();

    if (!inputData) {
      // Stop hook format: top-level decision + reason, no hookSpecificOutput
      console.log(JSON.stringify({
        reason: 'Transcript empty, proceeding with stop'
      }));
      process.exit(0);
    }

    let transcriptEntries;
    try {
      transcriptEntries = JSON.parse(inputData);
    } catch (e) {
      console.log(JSON.stringify({
        reason: 'Failed to parse transcript, proceeding with stop'
      }));
      process.exit(0);
    }

    // Verify transcript entries
    if (Array.isArray(transcriptEntries) && transcriptEntries.length > 0) {
      // Create verification marker if valid
      const isValid = validateTranscript(transcriptEntries);
      if (isValid) {
        const markerPath = path.join(__dirname, '.glootie-stop-verified');
        fs.writeFileSync(markerPath, `Verified at ${new Date().toISOString()}\nEntries: ${transcriptEntries.length}\n`);
      }
    }

    // Always allow stop to proceed
    console.log(JSON.stringify({
      reason: 'Stop hook completed'
    }));

    process.exit(0);
  } catch (error) {
    // Always output valid JSON on error
    console.log(JSON.stringify({
      reason: `Error in stop hook: ${error.message}`
    }));
    process.exit(0);
  }
}

function validateTranscript(entries) {
  // Validate transcript array structure
  if (!Array.isArray(entries) || entries.length === 0) {
    return false;
  }

  // Check for valid transcript entry types
  const validTypes = ['summary', 'file-history-snapshot', 'user', 'assistant'];

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      return false;
    }

    // Each entry should have a type field
    if (!entry.type || !validTypes.includes(entry.type)) {
      return false;
    }
  }

  return true;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data);
    });

    process.stdin.on('error', reject);

    // Timeout after 2 seconds if no input
    setTimeout(() => {
      if (!data) {
        resolve('');
      }
    }, 2000);
  });
}

main().catch(error => {
  console.log(JSON.stringify({
    reason: `Unhandled error: ${error.message}`
  }));
  process.exit(0);
});
