import Parser from 'tree-sitter';
import { createHash } from 'crypto';

export function extractEntities(tree, sourceCode, lang) {
  const entities = {
    functions: new Map(),
    classes: new Map(),
    imports: new Set(),
    exports: new Set(),
    patterns: new Map()
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