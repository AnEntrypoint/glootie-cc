import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load default ignore patterns from .thornsignore
function loadDefaultIgnores() {
  const ignorePath = join(__dirname, '.thornsignore');
  if (!existsSync(ignorePath)) {
    return getHardcodedIgnores();
  }

  try {
    const content = readFileSync(ignorePath, 'utf8');
    return parseIgnoreFile(content);
  } catch (e) {
    return getHardcodedIgnores();
  }
}

// Fallback hardcoded ignores if file doesn't exist
function getHardcodedIgnores() {
  return new Set([
    'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'out',
    'target', 'vendor', '__pycache__', '.pytest_cache', '.mypy_cache',
    '.next', '.nuxt', '.cache', '.parcel-cache', '.vite', '.turbo',
    'coverage', '.nyc_output', '.firebase', '.terraform', '.aws',
    '.azure', '.gcloud', '.vscode', '.idea', '.vs', 'bin', 'obj',
    '.gradle', '.mvn', 'Pods', 'DerivedData', '.bundle'
  ]);
}

// Parse ignore file format (gitignore-style)
function parseIgnoreFile(content) {
  const patterns = new Set();
  const lines = content.split('\n');

  for (let line of lines) {
    line = line.trim();

    // Skip comments and empty lines
    if (!line || line.startsWith('#')) continue;

    // Remove trailing slash for directory patterns
    if (line.endsWith('/')) {
      line = line.slice(0, -1);
    }

    // Skip negation patterns (!) for now - we're only ignoring
    if (line.startsWith('!')) continue;

    // Handle wildcards
    if (line.includes('*')) {
      // Convert glob patterns to directory prefixes where possible
      if (line.includes('*.')) {
        // File extension patterns - skip for directory matching
        continue;
      }
      // For patterns like .cache/, we can still use them
      line = line.replace(/\/\*+$/, ''); // Remove trailing wildcards
    }

    if (line) {
      patterns.add(line);
    }
  }

  return patterns;
}

// Load project-specific ignore files
function loadProjectIgnores(rootPath) {
  const patterns = new Set();
  const ignoreFiles = [
    '.gitignore',
    '.dockerignore',
    '.npmignore',
    '.eslintignore',
    '.prettierignore',
    '.thornsignore'
  ];

  for (const file of ignoreFiles) {
    const path = join(rootPath, file);
    if (existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf8');
        const filePatterns = parseIgnoreFile(content);
        for (const pattern of filePatterns) {
          patterns.add(pattern);
        }
      } catch (e) {
        // Ignore read errors
      }
    }
  }

  return patterns;
}

// Check if a path should be ignored
export function shouldIgnore(path, ignorePatterns) {
  const parts = path.split(/[\/\\]/);

  // Check each part of the path
  for (const part of parts) {
    if (ignorePatterns.has(part)) {
      return true;
    }

    // Check for patterns with wildcards
    for (const pattern of ignorePatterns) {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        if (regex.test(part)) {
          return true;
        }
      }

      // Check for prefix matches (e.g., ".cache" matches ".cache-loader")
      if (part.startsWith(pattern) && pattern.startsWith('.')) {
        return true;
      }
    }
  }

  return false;
}

// Build combined ignore set
export function buildIgnoreSet(rootPath) {
  const defaultIgnores = loadDefaultIgnores();
  const projectIgnores = loadProjectIgnores(rootPath);

  // Merge all patterns
  const combined = new Set([...defaultIgnores, ...projectIgnores]);

  return combined;
}

export { loadDefaultIgnores, loadProjectIgnores };