

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

## Development & Testing
- Use MCP for: client-side debugging globals, issue analysis, avoiding duplicates, immediate changes, playwright testing
- Use vexify glootie and playwright for testing
- Clear cache before playwright tests
- Use persistent background shell for testing
- Remove all non-top comments

## Code Quality
- Maintain clean, DRY, generalized, forward-thinking architecture
- Check git history for troubleshooting

## Workflow Process
- Assign "wfgy" mutables to remaining issues
- Scan codebase for related areas needing updates
- Use "WFGY" for architectural changes determination
- Deploy if deployable; publish if npm project
- Merge and sync GitHub intelligently
- Clean up non-permanent files
- Use "WFGY" for code selection during complex merges

## Final Steps
- Sync git repo
