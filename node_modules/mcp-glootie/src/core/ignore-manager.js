import ignore from 'ignore';
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ignoreFilterCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load universal ignore patterns from the shared file
function loadUniversalIgnorePatterns() {
  const universalIgnorePath = path.join(__dirname, 'universal-ignore.txt');
  try {
    const content = readFileSync(universalIgnorePath, 'utf8');
    return content
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.trim());
  } catch (error) {
    console.warn(`Warning: Could not load universal ignore patterns from ${universalIgnorePath}: ${error.message}`);
    // Fallback to minimal patterns if file can't be read
    return [
      'node_modules/**',
      '.git/**',
      'build/**',
      'dist/**',
      'coverage/**',
      '*.log',
      '.DS_Store',
      'Thumbs.db'
    ];
  }
}

export const CORE_IGNORE_PATTERNS = loadUniversalIgnorePatterns();

export const SOURCE_CODE_EXTENSIONS = [
  // Core web development
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',

  // Systems programming
  '.go', '.rs', '.py', '.pyx',
  '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp',

  // JVM languages
  '.java', '.kt', '.scala', '.groovy',

  // Mobile and Swift
  '.swift', '.m', '.mm', '.dart',

  // Shell and scripting
  '.sh', '.bash', '.zsh', '.fish', '.ps1',
  '.pl', '.pm', '.t', '.pod', '.lua',

  // Data and configuration
  '.r', '.R', '.Rmd', '.sql',
  '.json', '.yaml', '.yml', '.toml', '.ini', '.conf',

  // Web markup and styling (processed selectively)
  '.html', '.htm', '.css', '.scss', '.sass', '.less',
  '.vue', '.svelte', '.astro',

  // Documentation (limited processing)
  '.md', '.markdown', '.txt'

  // Removed redundant extensions and non-essential formats
  // for better performance and focus on source code
];

export function createIgnoreFilter(rootDir, customPatterns = [], options = {}) {
  const {
    useGitignore = true,
    useDefaults = true,
    caseSensitive = false,
    useCache = true
  } = options;
  
  const cacheKey = JSON.stringify({
    rootDir: path.resolve(rootDir),
    customPatterns: customPatterns.sort(),
    useGitignore,
    useDefaults,
    caseSensitive
  });
  
  if (useCache) {
    const cached = ignoreFilterCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.filter;
    }
  }
  const ig = ignore({ caseSensitive });
  
  if (useDefaults) {
    ig.add(CORE_IGNORE_PATTERNS);
  }
  
  if (customPatterns.length > 0) {
    ig.add(customPatterns);
  }
  
  if (useGitignore) {
    addGitignoreFiles(ig, rootDir);
  }
  const filter = {
    ig,
    rootDir,
    ignores: (filePath) => {
      // Ensure both paths are absolute for path.relative()
      const absoluteRoot = path.resolve(rootDir);
      const absoluteFile = path.resolve(filePath);
      const relativePath = path.relative(absoluteRoot, absoluteFile).replace(/\\/g, '/');
      return ig.ignores(relativePath);
    },
    add: (patterns) => ig.add(patterns),
    createSubFilter: (subDir) => createIgnoreFilter(subDir, customPatterns, options)
  };
  
  if (useCache) {
    ignoreFilterCache.set(cacheKey, {
      filter,
      timestamp: Date.now()
    });
  }
  return filter;
}
function addGitignoreFiles(ig, rootDir) {
  const scannedDirs = new Set();
  const MAX_DEPTH = 10;
  const MAX_DIRS = 1000;
  const scanGitignoreFiles = (dir, depth = 0) => {
    
    if (depth > MAX_DEPTH) return;
    if (scannedDirs.size > MAX_DIRS) return;
    const dirKey = path.resolve(dir);
    if (scannedDirs.has(dirKey)) return;
    scannedDirs.add(dirKey);
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      
      const gitignorePath = path.join(dir, '.gitignore');
      if (existsSync(gitignorePath)) {
        try {
          const content = readFileSync(gitignorePath, 'utf8');
          const patterns = content
            .split('\n')
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(line => line.trim());
          if (patterns.length > 0) {
            ig.add(patterns);
          }
        } catch (error) {
          
          console.warn(`Warning: Could not read .gitignore at ${gitignorePath}: ${error.message}`);
        }
      }
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.name.startsWith('.') ||
              entry.name === 'node_modules' ||
              entry.name === 'dist' ||
              entry.name === 'build' ||
              entry.name === 'target' ||
              entry.name === 'vendor' ||
              entry.name === 'coverage' ||
              entry.name === '.git') {
            continue;
          }
          scanGitignoreFiles(fullPath, depth + 1);
        }
      }
    } catch (error) {
      
      if (error.code !== 'ENOENT') {
        console.warn(`Warning: Could not scan directory ${dir}: ${error.message}`);
      }
    }
  };
  scanGitignoreFiles(rootDir);
}
export function createExtensionFilter(extensions = SOURCE_CODE_EXTENSIONS) {
  return (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    return extensions.includes(ext);
  };
}
export function createFileFilter(rootDir, customPatterns = [], options = {}) {
  const {
    extensions = SOURCE_CODE_EXTENSIONS,
    ...ignoreOptions
  } = options;
  const ignoreFilter = createIgnoreFilter(rootDir, customPatterns, ignoreOptions);
  const extensionFilter = createExtensionFilter(extensions);
  const fileFilter = {
    ...ignoreFilter,
    shouldProcess: (filePath) => {
      return !ignoreFilter.ignores(filePath) && extensionFilter(filePath);
    },
    filterFiles: (files) => files.filter(file => fileFilter.shouldProcess(file))
  };
  return fileFilter;
}
export function getDefaultIgnorePatterns() {
  return CORE_IGNORE_PATTERNS;
}
export function shouldIgnoreFile(filePath, ignorePatterns = null) {
  const patterns = ignorePatterns || CORE_IGNORE_PATTERNS;
  const ignoreFilter = createIgnoreFilter(path.dirname(filePath), patterns);
  return ignoreFilter.ignores(filePath);
}
export function clearIgnoreCache() {
  ignoreFilterCache.clear();
}

export function reloadUniversalIgnorePatterns() {
  // Clear cache to force reload with new patterns
  clearIgnoreCache();
  // Reload patterns from file
  return loadUniversalIgnorePatterns();
}
export function getCacheStats() {
  return {
    size: ignoreFilterCache.size,
    entries: Array.from(ignoreFilterCache.entries())
  };
}
export default {
  CORE_IGNORE_PATTERNS,
  SOURCE_CODE_EXTENSIONS,
  createIgnoreFilter,
  createExtensionFilter,
  createFileFilter,
  getDefaultIgnorePatterns,
  shouldIgnoreFile
};