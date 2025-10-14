#!/bin/bash

# Git integration hook for SandboxBox sessions
# This script runs when Claude Code stops and automatically commits changes

echo "🔧 GIT INTEGRATION: Analyzing session changes for intelligent commit..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "⚠️  Not in a Git repository - skipping Git integration"
    exit 0
fi

# Check for changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Changes detected in working directory:"
    git status --short

    # Stage all changes
    echo "📋 Staging changes for intelligent analysis..."
    git add -A

    # Get summary of staged changes
    echo "📊 Staged changes summary:"
    git diff --cached --stat

    # Create intelligent commit message based on changes
    echo "🤖 Generating intelligent commit message..."

    # Analyze the types of changes
    ADDED_FILES=$(git diff --cached --name-only --diff-filter=A | wc -l)
    MODIFIED_FILES=$(git diff --cached --name-only --diff-filter=M | wc -l)
    DELETED_FILES=$(git diff --cached --name-only --diff-filter=D | wc -l)

    # Get file types for intelligent categorization
    JS_FILES=$(git diff --cached --name-only | grep -E '\.(js|ts|jsx|tsx)$' | wc -l)
    MD_FILES=$(git diff --cached --name-only | grep -E '\.(md|mdx)$' | wc -l)
    JSON_FILES=$(git diff --cached --name-only | grep -E '\.json$' | wc -l)

    # Generate commit message
    COMMIT_MSG=""
    if [ $JS_FILES -gt 0 ]; then
        if [ $ADDED_FILES -gt 0 ]; then
            COMMIT_MSG="Add"
        else
            COMMIT_MSG="Update"
        fi

        if [ $JS_FILES -eq 1 ]; then
            COMMIT_MSG="$COMMIT_MSG JavaScript functionality"
        else
            COMMIT_MSG="$COMMIT_MSG multiple JavaScript files"
        fi
    elif [ $MD_FILES -gt 0 ]; then
        if [ $ADDED_FILES -gt 0 ]; then
            COMMIT_MSG="Add"
        else
            COMMIT_MSG="Update"
        fi

        if [ $MD_FILES -eq 1 ]; then
            COMMIT_MSG="$COMMIT_MSG documentation"
        else
            COMMIT_MSG="$COMMIT_MSG multiple documentation files"
        fi
    elif [ $JSON_FILES -gt 0 ]; then
        COMMIT_MSG="Update configuration"
    else
        if [ $ADDED_FILES -gt 0 ]; then
            COMMIT_MSG="Add new files"
        elif [ $DELETED_FILES -gt 0 ]; then
            COMMIT_MSG="Remove files"
        else
            COMMIT_MSG="Update files"
        fi
    fi

    # Add more specific details based on changed files
    CHANGED_FILES=$(git diff --cached --name-only)
    if echo "$CHANGED_FILES" | grep -q "package.json"; then
        COMMIT_MSG="$COMMIT_MSG and update dependencies"
    fi

    if echo "$CHANGED_FILES" | grep -q "README"; then
        COMMIT_MSG="$COMMIT_MSG and update documentation"
    fi

    # Commit with intelligent message
    echo "🚀 Committing changes: $COMMIT_MSG"
    git commit -m "$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    # Check if there's a remote to push to
    if git remote get-url origin > /dev/null 2>&1; then
        echo "📤 Pushing changes to remote repository..."
        git push origin HEAD 2>/dev/null || echo "⚠️  Push failed - check remote configuration"
    else
        echo "ℹ️  No remote configured - changes committed locally"
    fi

    echo "✅ Git integration completed successfully!"
    echo "📊 Summary: $ADDED_FILES added, $MODIFIED_FILES modified, $DELETED_FILES deleted"
else
    echo "✅ No changes detected - nothing to commit"
fi

# Show final git status
echo ""
echo "📋 Final repository status:"
git status --short