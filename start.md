

# Compact Development Workflow Guidelines

## File Management
-Stick to the permanent structure of the codebase, dont make ephimeral files while developing, use code execution instead
-Avoid mocks/simulations; focus on single, primary, working implementations with no failovers
-Always check for existing implementations before creating new files or functions
-Maintain a strict 200 line file size limit, split files >200 lines before continuing

## Documentation
-Continuously track and update CLAUDE.md with technical info that will help save time with future runs (no progress, no changelogs)
-Continuously track and update TODO.md with persitent todo information, you must continue working till TODO.md is completely cleared emptied, and deleted, never finish with anything left in TODO.md
-Continuously append CHANGELOG.md with concise change summaries

## Development & Debugging
-Always write dynamic, modular code that uses ground truth instead of hard coded values
-Set client-side debugging globals and use mcp playwright code execution for debugging and troubleshooting in real time
-Always hypothesize and troubleshoot ideas before implementing them by using these tools to execute code before implementing them, use glootie code execute and playwright code execution over mcp
-Also use the tools to run your debugging and troubleshooting instead of making additional files, code execution provides ground truth for your work
-After making code changes, use code execution to isolate the parts and debug them one by one, troubleshoot and fix any issues that remain, always make sure that the created code has no mocks, simulations, fallbacks, hardcoded values or anything fake.
-Use vexify for searching code that you dont know the specific syntax of, use glootie for clu code execution (always hyptothesize and test to find ground truth before editing files) and codebase wise searches and edits and playwright for debugging and troublshooting
-Keep code execution logs concice to make outputs easy to understand, massive repetitive logs will overwhelm the output. -4k chars should be considered a large output, the max is 30k
-Clear cache before playwright debugging
-Use only persistent background shells for running cli tools
-Remove all comments from the code immediately when encountered
-Your code reviewer will be very skeptical, you have to make the work extra complete and ground the output in real world truth dynamically

## Code Quality
Maintain clean, DRY, generalized, forward-thinking architecture
Check git history for troubleshooting regressions
Continuously reorganise any improvable code structures to make it as concise and simple as possible without losing any functionality, take all opportunities to make the codebase smaller without losing functionality, every extra symbol should be considered technical debt
No reports or summaries in the codebase
Dont use any adjectives or descriptive language in the code, dont duplicate existing functionality

## Workflow Process
Scan codebase for related areas needing updates
Deploy if deployable; publish if npm project
Clean up non-permanent files
If local testing is possible and saves time, use it over live testing, also test live if possible when finished
