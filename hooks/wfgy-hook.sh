#!/bin/bash
(npx -y wfgy@latest hook 2>&1 || echo 'error executing wfgy hook') | sed 's/^/WFGY_HOOK: /' && echo
