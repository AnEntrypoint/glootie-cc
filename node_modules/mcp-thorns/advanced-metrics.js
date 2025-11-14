import { createHash } from 'crypto';

export function extractAdvancedMetrics(tree, sourceCode) {
  const metrics = {
    identifiers: new Map(),
    functionLengths: [],
    functionParams: [],
    nestingDepths: [],
    commentLines: 0,
    blankLines: 0,
    longFunctions: [],
    deeplyNested: [],
    manyParams: []
  };

  const lines = sourceCode.split('\n');
  metrics.blankLines = lines.filter(l => l.trim() === '').length;
  metrics.commentLines = lines.filter(l => {
    const t = l.trim();
    return t.startsWith('//') || t.startsWith('#') || t.startsWith('/*') || t.startsWith('*');
  }).length;

  function getNodeDepth(node, depth = 0) {
    let maxDepth = depth;
    for (const child of node.children) {
      maxDepth = Math.max(maxDepth, getNodeDepth(child, depth + 1));
    }
    return maxDepth;
  }

  function countParams(node) {
    let count = 0;
    function traverse(n) {
      if (n.type === 'parameter' || n.type === 'formal_parameter' ||
          n.type.includes('param')) {
        count++;
      }
      for (const child of n.children) traverse(child);
    }
    traverse(node);
    return count;
  }

  function getFunctionBody(node) {
    for (const child of node.children) {
      if (child.type === 'block' || child.type === 'statement_block' ||
          child.type === 'body' || child.type.includes('body')) {
        return child;
      }
    }
    return node;
  }

  function traverse(node, depth = 0) {
    const type = node.type;

    // Track identifiers
    if (type === 'identifier' || type === 'property_identifier' ||
        type === 'type_identifier' || type === 'field_identifier') {
      const name = node.text;
      if (name && name.length < 50) {
        metrics.identifiers.set(name, (metrics.identifiers.get(name) || 0) + 1);
      }
    }

    // Track function metrics
    if (type.includes('function') && type.includes('declaration') ||
        type === 'method_definition' || type === 'function_item') {
      const body = getFunctionBody(node);
      const bodyLines = body.text.split('\n').length;
      const params = countParams(node);
      const nestDepth = getNodeDepth(body);

      metrics.functionLengths.push(bodyLines);
      metrics.functionParams.push(params);
      metrics.nestingDepths.push(nestDepth);

      if (bodyLines > 50) {
        metrics.longFunctions.push({ lines: bodyLines, text: node.text.slice(0, 100) });
      }
      if (nestDepth > 5) {
        metrics.deeplyNested.push({ depth: nestDepth, text: node.text.slice(0, 100) });
      }
      if (params > 5) {
        metrics.manyParams.push({ params, text: node.text.slice(0, 100) });
      }
    }

    for (const child of node.children) {
      traverse(child, depth + 1);
    }
  }

  traverse(tree.rootNode);
  return metrics;
}

export function detectDuplication(fileMetrics) {
  const hashes = new Map();
  const duplicates = [];

  for (const [file, data] of Object.entries(fileMetrics)) {
    if (!data.functionHashes) continue;

    for (const [funcSig, hash] of Object.entries(data.functionHashes)) {
      if (!hashes.has(hash)) {
        hashes.set(hash, []);
      }
      hashes.get(hash).push({ file, func: funcSig });
    }
  }

  for (const [hash, instances] of hashes) {
    if (instances.length > 1) {
      duplicates.push({
        hash,
        count: instances.length,
        instances: instances.slice(0, 5)
      });
    }
  }

  return duplicates.sort((a, b) => b.count - a.count).slice(0, 10);
}

export function hashFunction(node) {
  // Create structural hash of function (ignoring variable names)
  const structure = [];

  function traverse(n) {
    structure.push(n.type);
    for (const child of n.children) {
      if (!child.type.includes('identifier') && !child.type.includes('comment')) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return createHash('md5').update(structure.join(':')).digest('hex').slice(0, 8);
}

export function detectCircularDeps(graph) {
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();

  function dfs(node, path) {
    if (visiting.has(node)) {
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        cycles.push(path.slice(cycleStart).concat(node));
      }
      return;
    }

    if (visited.has(node)) return;

    visiting.add(node);
    path.push(node);

    const nodeData = graph.nodes.get(node);
    if (nodeData) {
      for (const dep of nodeData.importsFrom) {
        dfs(dep, [...path]);
      }
    }

    visiting.delete(node);
    visited.add(node);
  }

  for (const node of graph.nodes.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles.slice(0, 5);
}

export function analyzeFileSizes(fileMetrics) {
  const sizes = [];

  for (const [file, data] of Object.entries(fileMetrics)) {
    if (data.loc) {
      sizes.push({ file, lines: data.loc });
    }
  }

  sizes.sort((a, b) => b.lines - a.lines);

  return {
    largest: sizes.slice(0, 10),
    distribution: {
      tiny: sizes.filter(s => s.lines < 50).length,
      small: sizes.filter(s => s.lines >= 50 && s.lines < 200).length,
      medium: sizes.filter(s => s.lines >= 200 && s.lines < 500).length,
      large: sizes.filter(s => s.lines >= 500 && s.lines < 1000).length,
      huge: sizes.filter(s => s.lines >= 1000).length
    }
  };
}