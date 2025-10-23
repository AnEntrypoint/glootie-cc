#!/bin/bash
(npx -y mcp-thorns@latest 2>&1 || echo 'error executing mcp-thorns') | sed 's/^/MCP_THORNS: /' && echo
