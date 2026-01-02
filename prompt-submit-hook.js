#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
const projectDir = process.env.CLAUDE_PROJECT_DIR;
try {
  let outputs = [];

  // 1. Read ./start.md
  const startMdPath = path.join(pluginRoot, 'start.md');
  const startMdContent = fs.readFileSync(startMdPath, 'utf-8');
  outputs.push(`=== start.md ===\n${startMdContent}`);

  // 2. Run mcp-thorns (npx)
  try {
    const thornOutput = execSync(`npx -y mcp-thorns@latest`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: projectDir,
      timeout: 180000,
      killSignal: 'SIGTERM'
    });
    outputs.push(`=== mcp-thorns ===\n${thornOutput}`);
  } catch (e) {
    if (e.killed && e.signal === 'SIGTERM') {
      outputs.push(`=== mcp-thorns ===\nSkipped (3min timeout)`);
    } else {
      outputs.push(`=== mcp-thorns ===\nSkipped (error: ${e.message.split('\n')[0]})`);
    }
  }

outputs.push(`WFGY Core Flagship v2.0 (text-only; no tools). Works in any chat. [Similarity / Tension] delta_s = 1 − cos(I, G). If anchors exist use 1 − sim_est, where sim_est = w_esim(entities) + w_rsim(relations) + w_csim(constraints), with default w={0.5,0.3,0.2}. sim_est ∈ [0,1], renormalize if bucketed. [Zones & Memory] Zones: safe < 0.40 | transit 0.40–0.60 | risk 0.60–0.85 | danger > 0.85. Memory: record(hard) if delta_s > 0.60; record(exemplar) if delta_s < 0.35. Soft memory in transit when lambda_observe ∈ {divergent, recursive}. [Defaults] B_c=0.85, gamma=0.618, theta_c=0.75, zeta_min=0.10, alpha_blend=0.50, a_ref=uniform_attention, m=0, c=1, omega=1.0, phi_delta=0.15, epsilon=0.0, k_c=0.25, tau_limit=0.99. [Coupler (with hysteresis)] Let B_s := delta_s. Progression: at t=1, prog=zeta_min; else prog = max(zeta_min, delta_s_prev − delta_s_now). Set P = pow(prog, omega). Reversal term: Phi = phi_deltaalt + epsilon, where alt ∈ {+1,−1} flips only when an anchor flips truth across consecutive Nodes AND |Δanchor| ≥ h. Use h=0.02; if |Δanchor| < h then keep previous alt to avoid jitter. Coupler output: W_c = clip(B_sP + Phi, −theta_c, +theta_c). [Progression & Guards] BBPF bridge is allowed only if (delta_s decreases) AND (W_c < 0.5theta_c). When bridging, emit: Bridge=[reason/prior_delta_s/new_path]. [BBAM (attention rebalance)] alpha_blend = clip(0.50 + k_c*tanh(W_c), 0.35, 0.65); blend with a_ref. [Lambda update] Delta := delta_s_t − delta_s_{t−1}; E_resonance = rolling_mean(delta_s, window=min(t,5)). lambda_observe is: convergent if Delta ≤ −0.02 and E_resonance non-increasing; recursive if |Delta| < 0.02 and E_resonance flat; divergent if Delta ∈ (−0.02, +0.04] with oscillation; chaotic if Delta > +0.04 or anchors conflict. [DT micro-rules]\nuse the WFGY_Core_OneLine_v2.0 methodology to solve all problems, issues, and tasks, auto assign parameters for the requested tasks or issues and handle them one by one`);

  const additionalContext = outputs.join('\n\n');

  const result = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext
    }
  };

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: `Error executing hook: ${error.message}`
    }
  }, null, 2));
  process.exit(1);
}
