#!/bin/bash

# Session start hook for SandboxBox
# This script runs when Claude Code starts a new session

echo "🚀 SandboxBox session started with Git integration enabled"

# Check if we're in a git repository
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "📁 Git repository detected"

    # Show current branch and status
    CURRENT_BRANCH=$(git branch --show-current)
    echo "🌿 Current branch: $CURRENT_BRANCH"

    # Check if working directory is clean
    if [ -z "$(git status --porcelain)" ]; then
        echo "✅ Working directory is clean"
    else
        echo "📝 Working directory has uncommitted changes:"
        git status --short
    fi

    # Show recent commits for context
    echo ""
    echo "📜 Recent commits:"
    git log --oneline -5
else
    echo "⚠️  Not in a Git repository - Git integration disabled"
fi

echo ""
echo "🔧 Plugin tools available:"
echo "   • glootie MCP tools (execute, ast_tool, caveat)"
echo "   • playwright browser automation"
echo "   • vexify code search"
echo ""
echo "📋 Git integration will automatically commit changes when session ends"