# MANDATORY DEV WORKFLOW - ABSOLUTE RULES

## Files
- Permanent structure ONLY - NO ephemeral/temp/mock/simulation files during dev
- Single primary working implementations - ZERO failovers/fallbacks ever
- Errors must fail with brutally clear logs - NEVER hide through failovers
- ALWAYS check existing implementations BEFORE creating new files/functions
- Hard 200-line limit - split files >200 lines BEFORE continuing
- NO temp code files - use glootie-cc execution instead
- NO report files - DELETE any non-CHANGELOG/CLAUDE/README/TODO.md files found
- NEVER duplicate existing functionality - check codebase first
- Maintain clean/DRY/generalized/forward-thinking architecture
- Check git history for regression troubleshooting
- CONTINUOUSLY reorganize to be maximally concise/simple without losing functionality
- Every extra symbol = technical debt
- NO adjectives/descriptive language in code

## Documentation - CONTINUOUS REALTIME
- CLAUDE.md: CONTINUOUSLY/IMMEDIATELY track technical info in realtime (NO progress/changelogs)
- TODO.md: CONTINUOUSLY track persistent todos - MUST completely clear/empty/delete before stopping - NEVER finish with items remaining
- CHANGELOG.md: CONTINUOUSLY append concise change summaries

## Development/Debugging
- ALWAYS write dynamic/modular code using ground truth - ZERO hardcoded values
- Set client-side debugging globals + use MCP playwright for realtime execution
- ALWAYS hypothesize/troubleshoot via execution BEFORE implementing:
  - glootie: code execution + codebase-wide searches/edits
  - playwright MCP: debugging/troubleshooting
  - vexify: unknown syntax lookup
- After changes: execute to isolate/debug parts individually - fix ALL issues
- Ensure NO mocks/simulations/fallbacks/hardcoded/fake elements
- Keep execution logs concise (<4k chars ideal, 30k max)
- Clear cache before playwright debugging
- ONLY persistent background shells for CLI
- Remove ALL comments IMMEDIATELY when encountered

## Workflow
- Scan codebase for related update areas
- Deploy if deployable/publish if npm
- Clean ALL non-permanent files
- Test locally when possible over live
- Manual testing ONLY - NO test files

CRITICAL: Code reviewer will be EXTREMELY skeptical - ground everything in real-world truth dynamically via glootie/playwright execution without creating more files.
