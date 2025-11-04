#!/usr/bin/env node

// Post-install script to fix @ast-grep/napi Windows binding issue
// This works around npm bug #4828 with optional dependencies on Windows

import { platform, arch } from 'os';
import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execPromise = promisify(exec);

async function fixAstGrepBinding() {
  // Only run on Windows x64
  if (platform() !== 'win32' || arch() !== 'x64') {
    return;
  }

  // Find the node_modules directory relative to this script
  // Script is in: package_root/scripts/postinstall.js
  // node_modules is in: package_root/node_modules or parent/node_modules
  const packageRoot = join(__dirname, '..');
  let nodeModulesPath = join(packageRoot, 'node_modules');

  // If this is a dependency, node_modules is in parent's parent
  if (!existsSync(nodeModulesPath)) {
    nodeModulesPath = join(packageRoot, '..', '..');
  }

  const bindingPath = join(nodeModulesPath, '@ast-grep', 'napi-win32-x64-msvc');
  const nodeFile = join(bindingPath, 'ast-grep-napi.win32-x64-msvc.node');

  // Check if binding is already installed and has the .node file
  if (existsSync(nodeFile)) {
    return; // Silently succeed if already installed
  }

  // Silent installation - don't output anything to avoid interfering with MCP protocol
  try {
    // Use a temp directory for download
    const tempDir = join(packageRoot, '.ast-grep-temp');
    mkdirSync(tempDir, { recursive: true });

    // Download and extract the Windows binding
    await execPromise('npm pack @ast-grep/napi-win32-x64-msvc@0.39.5', { cwd: tempDir });
    await execPromise('tar -xzf ast-grep-napi-win32-x64-msvc-0.39.5.tgz', { cwd: tempDir });

    // Create directory and copy files using Node.js APIs (cross-platform)
    mkdirSync(bindingPath, { recursive: true });
    cpSync(join(tempDir, 'package'), bindingPath, { recursive: true });

    // Clean up
    rmSync(tempDir, { recursive: true, force: true });
  } catch (error) {
    // Silent failure - AST features will gracefully degrade
  }
}

fixAstGrepBinding().catch(() => {});