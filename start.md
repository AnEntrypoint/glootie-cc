

# Compact Development Workflow Guidelines

## File Management
- Create only permanent codebase files
- Avoid mocks/simulations; focus on primary implementations
- Check for existing implementations before creating new ones
- Split files >200 lines

## Documentation
- Update CLAUDE.md with technical info (not changelogs)
- Each file: single top comment with technical caveats, exports/imports, program structure relationship, internal functions
- Update file specs when editing; add specs to files without them

## Development & Debugging
- Use MCP for: client-side debugging globals, issue analysis, avoiding duplicates, immediate changes, playwright debugging
- Always hypothesize and troubleshoot ideas before implementing them by using these tools to execute code before implementing them
- Also use the tools to run your debugging and troubleshooting instead of making files, code execution provides ground truth for your work
- After making code changes, use code execution to isolate the parts and debug them one by one, troubleshoot and fix any issues that remain, always make sure that the created code has no mocks, simulations, fallbacks, hardcoded values or anything fake.
- Use vexify glootie and playwright for debugging and troublshooting
- Clear cache before playwright debugging
- Use only persistent background shells for running cli tools
- Remove all non-top comments

## Code Quality
- Maintain clean, DRY, generalized, forward-thinking architecture
- Check git history for troubleshooting

## Workflow Process
- Assign "wfgy" mutables to remaining issues
- Scan codebase for related areas needing updates
- Use "WFGY" for architectural changes determination
- Deploy if deployable; publish if npm project
- Clean up non-permanent files
- If local testing is possible and saves time, use it over live testing, also test live if possible
  
