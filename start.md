

# Compact Development Workflow Guidelines

## File Management
- Create only permanent codebase files
- Avoid mocks/simulations; focus on primary implementations
- Check for existing implementations before creating new ones
- Split files >200 lines

## Documentation
- Comtinuously update CLAUDE.md with technical info that will help save time with future runs (not changelogs)
- Each file: single top comment with technical caveats, exports/imports, program structure relationship, internal functions
- Update file specs when editing; add specs to files without them

## Development & Debugging
- Always write dynamic, modular code that uses ground truth instead of hard coded values
- set client-side debugging globals and use mcp playwright code execution for debugging and troubleshooting in real time
- Always hypothesize and troubleshoot ideas before implementing them by using these tools to execute code before implementing them, use glootie code execute and playwright code execution over mcp
- Also use the tools to run your debugging and troubleshooting instead of making additional files, code execution provides ground truth for your work
- After making code changes, use code execution to isolate the parts and debug them one by one, troubleshoot and fix any issues that remain, always make sure that the created code has no mocks, simulations, fallbacks, hardcoded values or anything fake.
- Use vexify for searching code that you dont know the specific syntax of, use glootie for clu code execution (always hyptothesize and test to find ground truth before editing files) and codebase wise searches and edits and playwright for debugging and troublshooting
- Keep code execution logs concice to make outputs easy to understand, massive repetitive logs will overwhelm the output. 4k chars should be considered a large output, the max is 30k
- Clear cache before playwright debugging
- Use only persistent background shells for running cli tools
- Remove all non-top comments
- Your code reviewer will be very skeptical, you have to make the work extra complete and ground the output in real world truth dynamically

## Code Quality
- Maintain clean, DRY, generalized, forward-thinking architecture
- Check git history for troubleshooting regressions
- Dont use any adjectives, dont duplicate existing code, keep structures as they are unless instructed to change them

## Workflow Process
- Assign "wfgy" mutables to remaining issues
- Scan codebase for related areas needing updates
- Use "WFGY" for architectural changes determination
- Deploy if deployable; publish if npm project
- Clean up non-permanent files
- If local testing is possible and saves time, use it over live testing, also test live if possible
  
