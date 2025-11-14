import Parser from 'tree-sitter';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, relative } from 'path';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';
import Rust from 'tree-sitter-rust';
import Go from 'tree-sitter-go';
import C from 'tree-sitter-c';
import Cpp from 'tree-sitter-cpp';
import Java from 'tree-sitter-java';
import CSharp from 'tree-sitter-c-sharp';
import Ruby from 'tree-sitter-ruby';
import PHP from 'tree-sitter-php';
import JSON from 'tree-sitter-json';
import { extractEntities, calculateMetrics } from './analyzer.js';
import { formatUltraCompact } from './compact-formatter.js';
import { extractDependencies, buildDependencyGraph, analyzeModules } from './dependency-analyzer.js';
import { extractAdvancedMetrics, detectDuplication, hashFunction, detectCircularDeps, analyzeFileSizes } from './advanced-metrics.js';
import { buildIgnoreSet, shouldIgnore } from './ignore-parser.js';

const LANGUAGES = {
  '.js': { parser: JavaScript, name: 'JavaScript' },
  '.mjs': { parser: JavaScript, name: 'JavaScript' },
  '.cjs': { parser: JavaScript, name: 'JavaScript' },
  '.jsx': { parser: JavaScript, name: 'JSX' },
  '.ts': { parser: TypeScript.typescript, name: 'TypeScript' },
  '.tsx': { parser: TypeScript.tsx, name: 'TSX' },
  '.py': { parser: Python, name: 'Python' },
  '.rs': { parser: Rust, name: 'Rust' },
  '.go': { parser: Go, name: 'Go' },
  '.c': { parser: C, name: 'C' },
  '.h': { parser: C, name: 'C' },
  '.cpp': { parser: Cpp, name: 'C++' },
  '.cc': { parser: Cpp, name: 'C++' },
  '.cxx': { parser: Cpp, name: 'C++' },
  '.hpp': { parser: Cpp, name: 'C++' },
  '.java': { parser: Java, name: 'Java' },
  '.cs': { parser: CSharp, name: 'C#' },
  '.rb': { parser: Ruby, name: 'Ruby' },
  '.php': { parser: PHP, name: 'PHP' },
  '.json': { parser: JSON, name: 'JSON' }
};

const MAX_FILE_SIZE = 200 * 1024; // 200KB - anything larger is build/generated code

function getLanguage(filepath) {
  const ext = extname(filepath);
  return LANGUAGES[ext];
}

function* walkDir(dir, baseDir = dir, ignorePatterns = new Set()) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = relative(baseDir, fullPath);

    // Check if path should be ignored
    if (shouldIgnore(relativePath, ignorePatterns) || shouldIgnore(entry.name, ignorePatterns)) {
      continue;
    }

    if (entry.isDirectory()) {
      yield* walkDir(fullPath, baseDir, ignorePatterns);
    } else if (entry.isFile()) {
      const lang = getLanguage(entry.name);
      if (lang) {
        try {
          const stat = statSync(fullPath);
          if (stat.size <= MAX_FILE_SIZE) {
            yield { path: fullPath, relativePath, lang };
          }
        } catch (e) {}
      }
    }
  }
}

function extractFunctionName(node) {
  for (const child of node.children) {
    if (child.type === 'identifier' || child.type === 'property_identifier') {
      return child.text;
    }
  }
  return 'anonymous';
}

function extractClassName(node) {
  for (const child of node.children) {
    if (child.type === 'identifier' || child.type === 'type_identifier') {
      return child.text;
    }
  }
  return 'Anonymous';
}

function countNodeParams(node) {
  let count = 0;
  function traverse(n) {
    if (n.type === 'parameter' || n.type === 'formal_parameter' || n.type.includes('param')) {
      count++;
    }
    for (const child of n.children) traverse(child);
  }
  traverse(node);
  return count;
}

function analyzeTree(tree, sourceCode) {
  const stats = {
    functions: 0,
    classes: 0,
    imports: 0,
    exports: 0,
    complexity: 0,
    lines: sourceCode.split('\n').length
  };

  function traverse(node) {
    const type = node.type;

    if (type.includes('function') && type.includes('declaration')) stats.functions++;
    if (type.includes('class') && type.includes('declaration')) stats.classes++;
    if (type.includes('import')) stats.imports++;
    if (type.includes('export')) stats.exports++;
    if (['if_statement', 'while_statement', 'for_statement', 'case_statement', 'catch_clause'].includes(type)) {
      stats.complexity++;
    }

    for (let child of node.children) {
      traverse(child);
    }
  }

  traverse(tree.rootNode);
  return stats;
}

function detectDeadCode(depGraph, fileMetrics, projectContext) {
  const deadCode = {
    unusedExports: [],
    testFiles: [],
    orphanedFiles: [],
    possiblyDead: []
  };

  if (!depGraph?.nodes) return deadCode;

  for (const [file, node] of depGraph.nodes) {
    const fileName = file.split('/').pop();
    const isTest = fileName.includes('.test.') || fileName.includes('.spec.') ||
                   file.includes('/test/') || file.includes('/__tests__/');

    if (isTest) {
      deadCode.testFiles.push(file);
      continue;
    }

    if (node.importedBy.size === 0 && node.exportedNames.size > 0) {
      const isEntry = fileName.includes('index.') || fileName.includes('main.') ||
                     fileName.includes('app.') || fileName.includes('server.');
      const isConfig = fileName.includes('config') || fileName.includes('.config.');

      if (!isEntry && !isConfig) {
        deadCode.unusedExports.push({
          file,
          exports: Array.from(node.exportedNames).slice(0, 3)
        });
      }
    }

    if (node.importedBy.size === 0 && node.importsFrom.size === 0) {
      deadCode.orphanedFiles.push(file);
    }

    if (node.importedBy.size === 1 && node.importsFrom.size === 0) {
      deadCode.possiblyDead.push({
        file,
        usedBy: Array.from(node.importedBy)[0]
      });
    }
  }

  return deadCode;
}

function analyzeProjectContext(rootPath) {
  const context = {
    type: 'unknown',
    framework: null,
    runtime: null,
    packageManager: null,
    scripts: {},
    dependencies: {},
    devDependencies: {},
    entry: null,
    build: null,
    test: null
  };

  try {
    const packagePath = join(rootPath, 'package.json');
    if (existsSync(packagePath)) {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
      context.scripts = pkg.scripts || {};
      context.dependencies = pkg.dependencies || {};
      context.devDependencies = pkg.devDependencies || {};

      if (pkg.dependencies?.next || pkg.devDependencies?.next) {
        context.framework = 'Next.js';
        context.type = 'web-app';
      } else if (pkg.dependencies?.react || pkg.devDependencies?.react) {
        context.framework = 'React';
        context.type = 'web-app';
      } else if (pkg.dependencies?.vite || pkg.devDependencies?.vite) {
        context.framework = 'Vite';
        context.type = 'web-app';
      }

      if (context.scripts.start) context.entry = context.scripts.start;
      if (context.scripts.build) context.build = context.scripts.build;
      if (context.scripts.test) context.test = context.scripts.test;
    }

    const denoPath = join(rootPath, 'deno.json');
    if (existsSync(denoPath)) {
      context.runtime = 'Deno';
      const deno = JSON.parse(readFileSync(denoPath, 'utf8'));
      if (deno.tasks) context.scripts = deno.tasks;
    }

    if (existsSync(join(rootPath, 'yarn.lock'))) context.packageManager = 'yarn';
    else if (existsSync(join(rootPath, 'pnpm-lock.yaml'))) context.packageManager = 'pnpm';
    else if (existsSync(join(rootPath, 'package-lock.json'))) context.packageManager = 'npm';
  } catch (e) {}

  return context;
}

function analyzeCodebase(rootPath = '.') {
  const parser = new Parser();
  const stats = { files: 0, totalLines: 0, byLanguage: {}, errors: [] };
  const entities = {};
  const metrics = { depths: [], hotspots: [] };
  const fileMetrics = {};
  const fileAnalysis = {};
  const projectContext = analyzeProjectContext(rootPath);

  // Build comprehensive ignore set - always exclude build artifacts
  const ignorePatterns = buildIgnoreSet(rootPath);

  for (const { path, relativePath, lang } of walkDir(rootPath, rootPath, ignorePatterns)) {
    try {
      parser.setLanguage(lang.parser);
      const source = readFileSync(path, 'utf8');
      const tree = parser.parse(source);

      const basicStats = analyzeTree(tree, source);
      const ents = extractEntities(tree, source, lang.name);
      const mets = calculateMetrics(tree, source);
      const deps = extractDependencies(tree, source, relativePath, lang.name);
      const advanced = extractAdvancedMetrics(tree, source);

      stats.files++;
      stats.totalLines += basicStats.lines;

      if (!stats.byLanguage[lang.name]) {
        stats.byLanguage[lang.name] = { files: 0, lines: 0, functions: 0, classes: 0, imports: 0, exports: 0, complexity: 0 };
      }

      const langStats = stats.byLanguage[lang.name];
      langStats.files++;
      langStats.lines += basicStats.lines;
      langStats.functions += basicStats.functions;
      langStats.classes += basicStats.classes;
      langStats.imports += basicStats.imports;
      langStats.exports += basicStats.exports;
      langStats.complexity += basicStats.complexity;

      if (!entities[lang.name]) {
        entities[lang.name] = { functions: new Map(), classes: new Map(), imports: new Set(), exports: new Set(), patterns: new Map() };
      }

      for (const [sig, data] of ents.functions) {
        const existing = entities[lang.name].functions.get(sig) || { count: 0, ...data };
        existing.count += data.count;
        entities[lang.name].functions.set(sig, existing);
      }

      for (const [name, data] of ents.classes) {
        const existing = entities[lang.name].classes.get(name) || { count: 0, ...data };
        existing.count += data.count;
        entities[lang.name].classes.set(name, existing);
      }

      for (const imp of ents.imports) entities[lang.name].imports.add(imp);
      for (const exp of ents.exports) entities[lang.name].exports.add(exp);

      for (const [pattern, count] of ents.patterns) {
        entities[lang.name].patterns.set(pattern, (entities[lang.name].patterns.get(pattern) || 0) + count);
      }

      metrics.depths.push(mets.maxDepth);

      if (mets.branches > 10 || mets.maxDepth > 8) {
        metrics.hotspots.push({
          file: relativePath,
          cx: mets.branches,
          depth: mets.maxDepth,
          loc: mets.loc
        });
      }

      // Store for dependency/duplication analysis
      fileAnalysis[relativePath] = {
        imports: deps.imports,
        exports: deps.exports,
        importPaths: deps.importPaths,
        exportedNames: deps.exportedNames
      };

      fileMetrics[relativePath] = {
        loc: mets.loc,
        advanced,
        functionHashes: {},
        functions: [],
        classes: []
      };

      function collectFunctionHashes(node, depth = 0) {
        if (node.type.includes('function') && node.type.includes('declaration') ||
            node.type === 'method_definition' || node.type === 'function_item') {
          const hash = hashFunction(node);
          const sig = node.text.slice(0, 50);
          fileMetrics[relativePath].functionHashes[sig] = hash;

          const name = extractFunctionName(node);
          const lines = node.text.split('\n').length;
          const startLine = node.startPosition.row + 1;
          fileMetrics[relativePath].functions.push({
            name,
            lines,
            startLine,
            params: countNodeParams(node)
          });
        }

        if (node.type.includes('class') && node.type.includes('declaration') ||
            node.type === 'struct_item' || node.type === 'enum_item' || node.type === 'interface_declaration') {
          const name = extractClassName(node);
          const startLine = node.startPosition.row + 1;
          fileMetrics[relativePath].classes.push({
            name,
            startLine
          });
        }

        for (const child of node.children) collectFunctionHashes(child, depth + 1);
      }
      collectFunctionHashes(tree.rootNode);

    } catch (e) {
      stats.errors.push({ file: relativePath, error: e.message });
    }
  }

  metrics.hotspots.sort((a, b) => b.cx + b.depth - (a.cx + a.depth));

  // Advanced analysis
  const depGraph = buildDependencyGraph(fileAnalysis);
  const duplicates = detectDuplication(fileMetrics);
  const circular = detectCircularDeps(depGraph);
  const fileSizes = analyzeFileSizes(fileMetrics);
  const modules = analyzeModules(fileAnalysis, rootPath);

  // Aggregate advanced metrics
  const allIdentifiers = new Map();
  const allFuncLengths = [];
  const allFuncParams = [];

  for (const [file, data] of Object.entries(fileMetrics)) {
    if (data.advanced) {
      for (const [id, count] of data.advanced.identifiers) {
        allIdentifiers.set(id, (allIdentifiers.get(id) || 0) + count);
      }
      allFuncLengths.push(...data.advanced.functionLengths);
      allFuncParams.push(...data.advanced.functionParams);
    }
  }

  const deadCode = detectDeadCode(depGraph, fileMetrics, projectContext);

  return {
    stats,
    entities,
    metrics,
    depGraph,
    duplicates,
    circular,
    fileSizes,
    modules,
    identifiers: allIdentifiers,
    funcLengths: allFuncLengths,
    funcParams: allFuncParams,
    fileMetrics,
    projectContext,
    deadCode
  };
}

export function analyze(rootPath = '.') {
  const aggregated = analyzeCodebase(rootPath);
  return formatUltraCompact(aggregated);
}

export { analyzeCodebase, formatUltraCompact };