#!/bin/bash

# Git integration instruction hook for SandboxBox sessions
# This script provides instructions to Claude for intelligent Git operations

echo "SESSION_END: Intelligently analyze all changes made during this session and prepare to commit them back to the host repository if they represent meaningful progress."

echo "GIT_INTEGRATION: Review modified files, stage appropriate changes, and create an intelligent commit message that describes the work accomplished. Push to host repository if changes are ready."

echo "INSTRUCTIONS:"
echo "1. Check git status to see what files were changed"
echo "2. Analyze the types of changes (JavaScript, documentation, configuration, etc.)"
echo "3. Stage only the meaningful changes that represent progress"
echo "4. Create an intelligent commit message that describes the work"
echo "5. Commit the changes to the working directory"
echo "6. Check if there's a remote configured and push if appropriate"
echo "7. Ensure the working directory is clean when complete"