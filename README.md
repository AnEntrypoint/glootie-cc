# glootius maximus (gm)

tl/dr: 
```
claude plugin marketplace add AnEntrypoint/gm
claude plugin install -s user gm@gm
#update
claude plugin marketplace update env
claude plugin update gm@gm
```

This is my personal dev workflow on discovering the best approach to automatic use of this, and use glootie for everything is already included as a system prompt, however prompting it does appear to help right now

the plugin marketplace will appear as 'gm'
the mcp tools will appear under the 'gm' plugin
plugin:gm:dev is how it will now execute all code, giving a controllable environment for execution, currently the recommended way to add client side coding abilities to this tool is playwriter:
https://github.com/remorses/playwriter
NOTE: playwriter uses a browser plugin, be sure to grab and activate that too to get browser access

what glootie does is it enacts a system policy as a virtual state machine that the LLM then has to try and emulate, enforces the use of code execution instead of file edit and run loops, 

<img width="225" height="325" alt="image" src="https://github.com/user-attachments/assets/866e6861-a2e2-490d-8bd0-ec558753dbed" />

**Note:** we use gxe as an npx-to-github proxy to start the tools faster and keep them up-to-date, if you ever need to fix an issue with partial installs or something, just delete ~/.gxe and try again

## Features

### Bundled Tools (drastically context-reduced)
- **glootie** - Code execution via `mcp-glootie@latest`
- **thorns** (loaded via hooks)
- **code-search** semantic code search









