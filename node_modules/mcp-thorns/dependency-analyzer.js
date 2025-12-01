import { relative, dirname, resolve, join, extname } from 'path';

export function extractDependencies(tree, sourceCode, filePath, lang) {
  const deps = {
    imports: new Set(),
    exports: new Set(),
    importPaths: new Set(),
    exportedNames: new Set()
  };

  function extractImportPath(node) {
    // Find string literal in import statement
    for (const child of node.children) {
      if (child.type === 'string' || child.type === 'string_literal' ||
          child.type === 'interpreted_string_literal') {
        return child.text.replace(/['"]/g, '');
      }
    }
    return null;
  }

  function extractExportedName(node) {
    for (const child of node.children) {
      if (child.type.includes('identifier') || child.type.includes('name')) {
        return child.text;
      }
      if (child.type.includes('declaration')) {
        return extractExportedName(child);
      }
    }
    return null;
  }

  function extractCommonJSExports(node) {
    if (node.type === 'assignment_expression' || node.type === 'expression_statement') {
      const text = node.text;
      if (text.startsWith('module.exports') || text.startsWith('exports.')) {
        if (text.includes('{')) {
          const match = text.match(/\{([^}]+)\}/);
          if (match) {
            const names = match[1].split(',').map(n => {
              const parts = n.trim().split(':');
              return parts[0].trim();
            });
            return names;
          }
        } else {
          const match = text.match(/exports\.(\w+)/);
          if (match) return [match[1]];
        }
      }
    }
    return [];
  }

  function traverse(node) {
    const type = node.type;

    if (type === 'import_statement' || type === 'import_from_statement' ||
        type === 'import_declaration' || type === 'use_declaration') {
      const path = extractImportPath(node);
      if (path) {
        deps.importPaths.add(path);
        deps.imports.add(node.text.slice(0, 80));
      }
    }

    if (type === 'call_expression') {
      const funcNode = node.children[0];
      if (funcNode && (funcNode.text === 'require' || funcNode.text === 'import')) {
        for (const child of node.children) {
          if (child.type === 'arguments') {
            for (const arg of child.children) {
              if (arg.type === 'string' || arg.type === 'string_fragment' || arg.type === 'template_string') {
                const path = arg.text.replace(/['"]/g, '');
                if (path && !path.includes('${')) {
                  deps.importPaths.add(path);
                  deps.imports.add(node.text.slice(0, 80));
                }
              }
            }
          }
        }
      }
    }

    if (type.includes('export')) {
      const name = extractExportedName(node);
      if (name) {
        deps.exportedNames.add(name);
      }
      deps.exports.add(node.text.slice(0, 80));
    }

    const cjsExports = extractCommonJSExports(node);
    if (cjsExports.length > 0) {
      for (const name of cjsExports) {
        deps.exportedNames.add(name);
      }
      deps.exports.add(node.text.slice(0, 80));
    }

    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(tree.rootNode);
  return deps;
}

export function buildDependencyGraph(fileAnalysis) {
  const graph = {
    nodes: new Map(),
    edges: [],
    orphans: new Set(),
    entryPoints: new Set(),
    coupling: new Map()
  };

  // Create nodes
  for (const [path, data] of Object.entries(fileAnalysis)) {
    graph.nodes.set(path, {
      imports: data.imports,
      exports: data.exports,
      importPaths: data.importPaths,
      exportedNames: data.exportedNames,
      importedBy: new Set(),
      importsFrom: new Set()
    });
  }

  // Build edges
  for (const [fromPath, data] of graph.nodes) {
    const fromDir = dirname(fromPath);

    for (const impPath of data.importPaths) {
      // Try to resolve the import to an actual file
      const resolved = resolveImport(impPath, fromDir, fileAnalysis);
      if (resolved) {
        data.importsFrom.add(resolved);
        const targetNode = graph.nodes.get(resolved);
        if (targetNode) {
          targetNode.importedBy.add(fromPath);
        }
        graph.edges.push({ from: fromPath, to: resolved, type: 'import' });
      }
    }
  }

  // Identify orphans (files not imported by anyone)
  for (const [path, data] of graph.nodes) {
    if (data.importedBy.size === 0) {
      graph.orphans.add(path);
    }
  }

  // Identify entry points (files that don't import anything)
  for (const [path, data] of graph.nodes) {
    if (data.importsFrom.size === 0 && data.importedBy.size > 0) {
      graph.entryPoints.add(path);
    }
  }

  // Calculate coupling (files with most dependencies)
  for (const [path, data] of graph.nodes) {
    const coupling = data.importsFrom.size + data.importedBy.size;
    if (coupling > 0) {
      graph.coupling.set(path, {
        in: data.importedBy.size,
        out: data.importsFrom.size,
        total: coupling
      });
    }
  }

  return graph;
}

function resolveImport(importPath, fromDir, fileAnalysis) {
  if (importPath.startsWith('.')) {
    const normalized = join(fromDir, importPath).replace(/\\/g, '/');
    const cleanPath = normalized.replace(/^\.\//, '');

    if (fileAnalysis[cleanPath]) return cleanPath;
    if (fileAnalysis[normalized]) return normalized;

    const exts = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];
    const indexExts = ['/index.js', '/index.ts', '/index.jsx', '/index.tsx'];

    for (const ext of exts) {
      const withExt = cleanPath.replace(/\.(js|ts|jsx|tsx|mjs|cjs)$/, '') + ext;
      if (fileAnalysis[withExt]) return withExt;
    }

    for (const ext of indexExts) {
      const withIdx = cleanPath.replace(/\/$/, '') + ext;
      if (fileAnalysis[withIdx]) return withIdx;
    }
  }

  const paths = Object.keys(fileAnalysis);
  const fileName = importPath.split('/').pop();
  const fileNameNoExt = fileName.replace(/\.(js|ts|jsx|tsx|mjs|cjs)$/, '');

  for (const path of paths) {
    const pathParts = path.split('/');
    const pathFileName = pathParts[pathParts.length - 1];
    const pathFileNameNoExt = pathFileName.replace(/\.(js|ts|jsx|tsx|mjs|cjs)$/, '');

    if (pathFileNameNoExt === fileNameNoExt) {
      const importParts = importPath.split('/').filter(p => p && p !== '.');
      let matches = true;
      for (let i = importParts.length - 1, j = pathParts.length - 1; i >= 0 && j >= 0; i--, j--) {
        const importPart = importParts[i].replace(/\.(js|ts|jsx|tsx|mjs|cjs)$/, '');
        const pathPart = pathParts[j].replace(/\.(js|ts|jsx|tsx|mjs|cjs)$/, '');
        if (importPart !== pathPart) {
          matches = false;
          break;
        }
      }
      if (matches) return path;
    }
  }

  return null;
}

export function analyzeModules(fileAnalysis, baseDir) {
  const modules = new Map();

  for (const path of Object.keys(fileAnalysis)) {
    const rel = relative(baseDir, path);
    const parts = rel.split(/[\/\\]/);
    const moduleName = parts[0];

    if (!modules.has(moduleName)) {
      modules.set(moduleName, {
        files: 0,
        imports: 0,
        exports: 0,
        internalDeps: 0,
        externalDeps: 0
      });
    }

    const mod = modules.get(moduleName);
    mod.files++;
  }

  return modules;
}