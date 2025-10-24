#!/bin/bash
echo "=== WFGY_HOOK CONTEXT ===" && npx -y wfgy@latest hook 2>&1 && echo "=== END WFGY_HOOK ==="
