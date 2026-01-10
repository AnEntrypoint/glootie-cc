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

    // Verify last few transcript entries
    if (Array.isArray(transcriptEntries) && transcriptEntries.length > 0) {
      const lastEntry = transcriptEntries[transcriptEntries.length - 1];

      // Verify transcript integrity
      const isValid = validateTranscript(lastEntry);

      if (isValid) {
        // Create verification marker
        const markerPath = path.join(__dirname, '.glootie-stop-verified');
        fs.writeFileSync(markerPath, `Verified at ${new Date().toISOString()}\n`);

        // Allow stop - transcript verified
        console.log(JSON.stringify({
          reason: 'Transcript verified successfully'
        }));
      } else {
        // Block stop - transcript invalid
        console.log(JSON.stringify({
          decision: 'block',
          reason: 'Transcript validation failed - cannot stop'
        }));
      }
    } else {
      // Block stop - no entries found
      console.log(JSON.stringify({
        decision: 'block',
        reason: 'No transcript entries found - cannot verify'
      }));
    }

    process.exit(0);
  } catch (error) {
    // Always output valid JSON on error
    console.log(JSON.stringify({
      reason: `Error in stop hook: ${error.message}`
    }));
    process.exit(0);
  }
}

function validateTranscript(entry) {
  // Basic validation: check that entry has expected structure
  if (!entry) return false;

  // Verify it has some message content
  if (entry.message && typeof entry.message === 'object') {
    return true;
  }

  if (entry.entry && typeof entry.entry === 'object') {
    return true;
  }

  return false;
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
    continue: true,
    suppressOutput: false,
    stopReason: `Unhandled error: ${error.message}`
  }));
  process.exit(0);
});
