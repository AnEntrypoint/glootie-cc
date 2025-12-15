# MANDATORY DEV WORKFLOW - ABSOLUTE RULES - NO EXCEPTIONS
- Maintain permanent structure ONLY - NO ephemeral/temp/mock/simulation files, no progress docuementation or summaries
- Always use glootie mcp and playwright mcp execution instead of cli execution and writing files for code execution, no exceptions
- Create single primary working implementations - ZERO failovers/fallbacks ever, no exceptions
- Minimize code through referential stuctures, never write duplicate code anywhere, no execptions
- Errors must fail with brutally clear logs - NEVER hide through failovers or fake data, no exceptions
- Thorns provides a code overview, dont do manual exploration for what it already revealed (use npx -y mcp-thorns@latest <path> for custom paths iin monorepos)
- Hard 200-line limit - split files >200 lines BEFORE continuing immediately, always finish your todo list with codebase cleanup
- Never mke report files - DELETE any non-CLAUDE/README/TODO.md files found immdidately
- Never keep changelogs or history files
- Never report or summarize before all work is done exhaustively, as well as troubleshooted and confirmed to work
- Maintain clean/DRY/generalized/forward-thinking architecture, immediately solve arhitetural issues that can be dried up, CONTINUOUSLY reorganize to be maximally concise/simple without losing functionality, maximize modularity, dynamism, conciseness, through referntial structures, convention and frameworking. we want the minimal code to implement all required features
- code execution with glootie mcp is 10x more efficient than manual steps, you're expected to prefer that
- Check git history for troubleshooting known regressions, dont revert, use differential comparisons and edit the new code manually
- Every extra symbol = technical debt, enforcing clean short concise functional code is mandatory
- ALWAYS write dynamic/modular code using ground truth - ZERO hardcoded values
- NO adjectives/descriptive language in code
- CLAUDE.md: CONTINUOUSLY/IMMEDIATELY track technical info in realtime (NO progress/changelogs)
- TODO.md: CONTINUOUSLY track persistent todos - MUST completely clear/empty/delete before stopping - NEVER finish with items remaining
- CHANGELOG.md: CONTINUOUSLY append concise change summaries
- Set client-side debugging globals to make ALL client side data accessible via simple repl and use MCP playwright for realtime execution
- ALWAYS hypothesize/troubleshoot via execution BEFORE editing any files glootie mcp code execution playwright MCP: client debugging/troubleshooting, first ensure that you have working code in execution environments before editing files, if glootie mcp or playwright mcp is not available, stop and ask for it to be restarted
- After changes: use glootie and playwright mcp execute to isolate/debug/troubleshoot parts individually and fix any outstanding issues
- Ensure NO mocks/simulations/fallbacks/hardcoded/fake elements
- Keep execution logs concise in code execution(<4k chars ideal, 30k max)
- Close playwright mcp and navigate again to clear cache
- Remove ALL comments immediately when encountered, never write comments anywhere
- Deploy if deployable/publish if npm if its on npm
- Clean ALL files not required for the program to function at the end of your todo, and create a new todo with all the work left to perform, WFGY this process
- Test locally when possible, test live otherwise
- Manual testing ONLY - NO test files
- Never call pkill, it doesnt work and will end your process
- Make a comprehensive todo list before initiating any work, manually execute the entire todo list untill its empty
- never run eval.js manually, it will run automatically at the end of your processes






