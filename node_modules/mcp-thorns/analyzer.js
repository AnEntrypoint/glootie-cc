import Parser from 'tree-sitter';
import { createHash } from 'crypto';

export function extractEntities(tree, sourceCode, lang) {
  const entities = {
    functions: new Map(),
    classes: new Map(),
    imports: new Set(),
    exports: new Set(),
    patterns: new Map(),
    asyncPatterns: { async: 0, await: 0, promise: 0, callback: 0, thenCatch: 0 },
    errorPatterns: { tryCatch: 0, throw: 0, errorTypes: new Set() },
    internalCalls: new Map(),
    constants: [],
    globalState: [],
    envVars: new Set(),
    urls: new Set(),
    filePaths: new Set(),
    eventPatterns: { emitters: 0, listeners: 0 },
    httpPatterns: { routes: [], fetches: 0, axios: 0 },
    storagePatterns: { sql: 0, fileOps: 0, json: 0 }
  };

  function hash(text) {
    return createHash('md5').update(text).digest('hex').slice(0, 8);
  }

  function extractName(node) {
    if (node.type === 'identifier' || node.type === 'property_identifier' || node.type === 'type_identifier') {
      return node.text;
    }
    for (const child of node.children) {
      if (child.type.includes('identifier')) return child.text;
    }
    return null;
  }

  function traverse(node) {
    const type = node.type;
    const text = node.text;

    // Functions
    if (type.includes('function') && type.includes('declaration') ||
        type === 'method_definition' || type === 'function_item') {
      const name = extractName(node) || 'anon';
      const params = text.match(/\((.*?)\)/)?.[1] || '';
      const sig = `${name}(${params.split(',').length})`;
      const h = hash(text);
      const existing = entities.functions.get(sig) || { count: 0, hash: h, params };
      existing.count++;
      entities.functions.set(sig, existing);
    }

    // Classes/structs/types
    if (type.includes('class') && type.includes('declaration') ||
        type === 'struct_item' || type === 'enum_item' || type === 'interface_declaration') {
      const name = extractName(node) || 'anon';
      const existing = entities.classes.get(name) || { count: 0, type: type.split('_')[0] };
      existing.count++;
      entities.classes.set(name, existing);
    }

    // Imports
    if (type.includes('import')) {
      const imp = text.replace(/\s+/g, ' ').slice(0, 60);
      entities.imports.add(imp);
    }

    // Exports
    if (type.includes('export')) {
      const exp = extractName(node) || text.slice(0, 30);
      entities.exports.add(exp);
    }

    // Patterns (API calls, common patterns)
    if (type === 'call_expression' || type === 'call' || type === 'function_call') {
      const name = node.children[0]?.text || '';
      if (name && name.length < 30) {
        const existing = entities.patterns.get(name) || 0;
        entities.patterns.set(name, existing + 1);

        if (!name.includes('.') && name.match(/^[a-z]/)) {
          entities.internalCalls.set(name, (entities.internalCalls.get(name) || 0) + 1);
        }

        if (name.endsWith('.then') || name.endsWith('.catch')) {
          entities.asyncPatterns.thenCatch++;
        }
        if (name === 'Promise' || name.startsWith('Promise.')) {
          entities.asyncPatterns.promise++;
        }
      }
    }

    // Async patterns
    if (type === 'async_function' || type === 'async_arrow_function' || type === 'async_function_declaration' || text.startsWith('async ')) {
      entities.asyncPatterns.async++;
    }
    if (type === 'await_expression') {
      entities.asyncPatterns.await++;
    }

    // Callback patterns (function params that look like callbacks)
    if ((type === 'arrow_function' || type === 'function_expression') && node.parent?.type === 'arguments') {
      entities.asyncPatterns.callback++;
    }

    // Error handling patterns
    if (type === 'try_statement') {
      entities.errorPatterns.tryCatch++;
    }
    if (type === 'throw_statement') {
      entities.errorPatterns.throw++;
      const errType = text.match(/throw new (\w+)/)?.[1];
      if (errType) entities.errorPatterns.errorTypes.add(errType);
    }

    // Constants (module-level const declarations with UPPER_CASE names or literal values)
    if (type === 'lexical_declaration' && text.startsWith('const ')) {
      const isTopLevel = node.parent?.type === 'program' || node.parent?.type === 'export_statement';
      if (isTopLevel) {
        const nameMatch = text.match(/const\s+(\w+)\s*=/);
        if (nameMatch) {
          const name = nameMatch[1];
          const isConstStyle = name === name.toUpperCase() && name.length > 2;
          const hasLiteralValue = /=\s*(\d+|['"`][^'"`]*['"`]|true|false|null)/.test(text);
          if (isConstStyle || hasLiteralValue) {
            const valueMatch = text.match(/=\s*([^;]+)/);
            const value = valueMatch ? valueMatch[1].trim().slice(0, 30) : '';
            entities.constants.push({ name, value });
          }
        }
      }
    }

    // Global state (module-level let/var declarations)
    if ((type === 'lexical_declaration' && text.startsWith('let ')) || type === 'variable_declaration') {
      const isTopLevel = node.parent?.type === 'program' || node.parent?.type === 'export_statement';
      if (isTopLevel && !text.startsWith('const ')) {
        const nameMatch = text.match(/(let|var)\s+(\w+)/);
        if (nameMatch) {
          entities.globalState.push(nameMatch[2]);
        }
      }
    }

    // Environment variables
    const envMatch = text.match(/process\.env\.(\w+)/g);
    if (envMatch) {
      envMatch.forEach(e => entities.envVars.add(e.replace('process.env.', '')));
    }

    // URLs and paths in strings
    if (type === 'string' || type === 'template_string') {
      const urlMatch = text.match(/https?:\/\/[^\s'"`,)]+/g);
      if (urlMatch) urlMatch.forEach(u => entities.urls.add(u.slice(0, 60)));

      const pathMatch = text.match(/['"](\.?\.?\/[\w\-./]+)['"]/);
      if (pathMatch && pathMatch[1].includes('/')) {
        entities.filePaths.add(pathMatch[1]);
      }
    }

    // Event patterns
    if (type === 'call_expression') {
      const callText = node.children[0]?.text || '';
      if (callText.match(/\.(on|once|addEventListener|addListener)\s*$/)) {
        entities.eventPatterns.listeners++;
      }
      if (callText.match(/\.(emit|dispatch|dispatchEvent|trigger)\s*$/)) {
        entities.eventPatterns.emitters++;
      }

      // HTTP patterns
      if (callText === 'fetch' || callText.endsWith('.fetch')) {
        entities.httpPatterns.fetches++;
      }
      if (callText.match(/axios\.(get|post|put|delete|patch)/)) {
        entities.httpPatterns.axios++;
      }
      if (callText.match(/\.(get|post|put|delete|patch|use)\s*$/) && text.includes("'/" )) {
        const routeMatch = text.match(/['"](\/.+?)['"]/);
        if (routeMatch) entities.httpPatterns.routes.push(routeMatch[1]);
      }

      // Storage patterns
      if (callText.match(/\.(query|execute|prepare|run)\s*$/) || text.includes('SELECT') || text.includes('INSERT')) {
        entities.storagePatterns.sql++;
      }
      if (callText.match(/(readFile|writeFile|readdir|mkdir|unlink|stat)/)) {
        entities.storagePatterns.fileOps++;
      }
      if (callText.match(/JSON\.(parse|stringify)/)) {
        entities.storagePatterns.json++;
      }
    }

    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(tree.rootNode);
  return entities;
}

export function calculateMetrics(tree, sourceCode) {
  let depth = 0, maxDepth = 0, nodes = 0;
  let branches = 0, loops = 0, returns = 0;

  function traverse(node, level = 0) {
    nodes++;
    maxDepth = Math.max(maxDepth, level);

    const type = node.type;
    if (['if_statement', 'switch_statement', 'case_statement', 'conditional_expression', 'match_expression'].includes(type)) branches++;
    if (['while_statement', 'for_statement', 'loop_expression', 'for_in_statement'].includes(type)) loops++;
    if (type.includes('return')) returns++;

    for (const child of node.children) {
      traverse(child, level + 1);
    }
  }

  traverse(tree.rootNode);

  const lines = sourceCode.split('\n');
  const blankLines = lines.filter(l => l.trim() === '').length;
  const commentLines = lines.filter(l => {
    const t = l.trim();
    return t.startsWith('//') || t.startsWith('#') || t.startsWith('/*') || t.startsWith('*');
  }).length;

  return {
    nodes,
    maxDepth,
    branches,
    loops,
    returns,
    loc: lines.length,
    sloc: lines.length - blankLines - commentLines,
    density: nodes / lines.length
  };
}