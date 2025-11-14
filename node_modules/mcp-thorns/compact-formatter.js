export function formatUltraCompact(aggregated) {
  const { stats, entities, metrics, depGraph, duplicates, circular, fileSizes, identifiers, funcLengths, funcParams, fileMetrics, projectContext, deadCode } = aggregated;

  const totalFn = Object.values(stats.byLanguage).reduce((s, l) => s + l.functions, 0);
  const totalCls = Object.values(stats.byLanguage).reduce((s, l) => s + l.classes, 0);
  const avgCx = totalFn > 0 ? (Object.values(stats.byLanguage).reduce((s, l) => s + l.complexity, 0) / totalFn).toFixed(1) : 0;

  let output = '';

  const projectInfo = getProjectInfo(projectContext);
  if (projectInfo) {
    output += `## 🎯 ${projectInfo}\n\n`;
  }

  output += `# ${stats.files}f ${k(stats.totalLines)}L ${totalFn}fn ${totalCls}cls cx${avgCx}\n`;
  output += `*f=files L=lines fn=funcs cls=classes cx=complexity ↑=imports ↓=imported-by L0-L3=layers file:line:name*\n\n`;

  const langs = Object.entries(stats.byLanguage)
    .sort((a, b) => b[1].lines - a[1].lines)
    .slice(0, 3)
    .map(([lang, data]) => `${lang.slice(0,3)}${(data.lines/stats.totalLines*100).toFixed(0)}%`)
    .join(' ');
  output += `**Langs:** ${langs}\n\n`;

  const techStack = getTechStack(entities, identifiers);
  if (techStack) {
    output += `## 🛠️ Tech Stack\n\n${techStack}\n`;
  }

  const features = getFeatures(fileMetrics, identifiers);
  if (features) {
    output += `## 🎯 Features\n\n${features}\n`;
  }

  const codeOrg = getCodeOrganization(fileSizes, funcLengths, funcParams, totalFn, totalCls, stats.files, fileMetrics);
  if (codeOrg) {
    output += `## 📊 Code Organization\n\n${codeOrg}\n`;
  }

  const flow = generateDetailedFlow(depGraph, entities, stats.files, circular);
  if (flow) {
    output += `## 🔄 Architecture\n\n${flow}\n`;
  }

  const apiSurface = getAPISurface(entities, depGraph);
  if (apiSurface) {
    output += `## 🔌 API Surface\n\n${apiSurface}\n`;
  }

  const issues = getCompactIssues(circular, duplicates, metrics, fileSizes, fileMetrics);
  if (issues.length > 0) {
    output += `## 🚨 Issues\n\n`;
    issues.forEach(issue => output += `- ${issue}\n`);
    output += '\n';
  }

  const deadCodeSection = getDeadCodeSection(deadCode);
  if (deadCodeSection) {
    output += `## 🧹 Dead Code & Tests\n\n${deadCodeSection}\n`;
  }

  const modules = getModuleStructure(depGraph, stats.files, fileSizes);
  if (modules.length > 0) {
    output += `## 📦 Modules\n\n`;
    modules.forEach(mod => output += `- ${mod}\n`);
  }

  return output.trim();
}

function generateDetailedFlow(depGraph, entities, totalFiles, circular) {
  if (!depGraph?.coupling || totalFiles < 3) return '';

  const flow = [];
  const connections = Array.from(depGraph.coupling.entries())
    .map(([file, coupling]) => ({
      file: file.split('/').pop().replace(/\.\w+$/, ''),
      fullPath: file,
      dir: file.split('/')[0] || 'root',
      in: coupling.in,
      out: coupling.out,
      total: coupling.in + coupling.out
    }))
    .sort((a, b) => b.total - a.total);

  const layeredFlow = buildLayeredFlow(depGraph, connections);
  if (layeredFlow.length > 0) {
    flow.push(...layeredFlow);
  }

  const modules = {};
  connections.forEach(c => {
    if (!modules[c.dir]) modules[c.dir] = { count: 0, connections: 0, in: 0, out: 0 };
    modules[c.dir].count++;
    modules[c.dir].connections += c.total;
    modules[c.dir].in += c.in;
    modules[c.dir].out += c.out;
  });

  const crossModuleDeps = analyzeCrossModuleDeps(depGraph, modules);
  if (crossModuleDeps.length > 0) {
    flow.push(`**Cross-module:** ${crossModuleDeps.slice(0, 6).join(', ')}`);
  }

  const moduleFlow = buildModuleFlow(modules);
  if (moduleFlow) {
    flow.push(`**Module flow:** ${moduleFlow}`);
  }

  const externals = getTopExternalDeps(entities);
  if (externals.length > 0) {
    flow.push(`**External:** ${externals.slice(0, 6).join(', ')}${externals.length > 6 ? ` (+${externals.length - 6})` : ''}`);
  }

  const specificDeps = buildSpecificDependencies(depGraph, connections);
  if (specificDeps.length > 0) {
    flow.push(`**Key deps:** ${specificDeps.slice(0, 8).join(', ')}`);
  }

  const topHubs = connections.filter(c => c.total >= 5).slice(0, 5);
  if (topHubs.length > 0) {
    const hubDesc = topHubs.map(h => `${h.file}(${h.out}↑${h.in}↓)`).join(', ');
    flow.push(`**Hubs:** ${hubDesc}`);
  }

  const leaves = connections.filter(c => c.in === 0 && c.out > 0).sort((a, b) => b.out - a.out).slice(0, 8);
  const totalLeaves = connections.filter(c => c.in === 0 && c.out > 0).length;
  if (leaves.length > 0 && totalLeaves <= 20) {
    const leafDesc = leaves.map(l => `${l.file}(${l.out}↑)`).join(', ');
    flow.push(`**Leaf nodes:** ${leafDesc}${totalLeaves > 8 ? ` (+${totalLeaves - 8})` : ''}`);
  } else if (totalLeaves > 20) {
    const topLeaves = leaves.slice(0, 4).map(l => `${l.file}(${l.out}↑)`).join(', ');
    flow.push(`**Leaf nodes:** ${topLeaves} (+${totalLeaves - 4} entry points)`);
  }

  const trueOrphans = connections.filter(c => c.total === 0 && !isObviousEntryPoint(c.fullPath));
  if (trueOrphans.length > 0) {
    const orphanNames = trueOrphans.slice(0, 6).map(o => o.file).join(', ');
    flow.push(`**Orphans:** ${orphanNames}${trueOrphans.length > 6 ? ` (+${trueOrphans.length - 6})` : ''}`);
  }

  const concerns = [];
  const cycles = circular?.length || 0;
  const isolated = connections.filter(c => c.total === 0).length;
  const megaHubs = connections.filter(c => c.total >= 15).length;

  if (cycles > 0) concerns.push(`🔄${cycles} cycles`);
  if (isolated > 10) concerns.push(`🏝️${isolated} isolated`);
  if (megaHubs > 0) concerns.push(`🔥${megaHubs} mega-hubs`);

  if (concerns.length > 0) {
    flow.push(`**Concerns:** ${concerns.join(' ')}`);
  }

  return flow.join('\n');
}

function buildLayeredFlow(depGraph, connections) {
  const layers = [];
  const nodeMap = new Map();

  connections.forEach(c => nodeMap.set(c.fullPath, c));

  const layer0 = connections.filter(c => c.out === 0 && c.in > 0).sort((a, b) => b.in - a.in).slice(0, 8);
  if (layer0.length > 0) {
    const names = layer0.map(n => `${n.file}(${n.in}↓)`).join(', ');
    layers.push(`**L0 [pure exports]:** ${names}${connections.filter(c => c.out === 0 && c.in > 0).length > 8 ? ` (+${connections.filter(c => c.out === 0 && c.in > 0).length - 8})` : ''}`);
  }

  const layer1 = connections.filter(c => c.out >= 1 && c.out <= 3 && c.in >= 3).sort((a, b) => b.in - a.in).slice(0, 8);
  if (layer1.length > 0) {
    const names = layer1.map(n => `${n.file}(${n.out}↑${n.in}↓)`).join(', ');
    layers.push(`**L1 [low imports]:** ${names}`);
  }

  const layer2 = connections.filter(c => c.out >= 4 && c.in >= 2).sort((a, b) => (b.in + b.out) - (a.in + a.out)).slice(0, 8);
  if (layer2.length > 0) {
    const names = layer2.map(n => `${n.file}(${n.out}↑${n.in}↓)`).join(', ');
    layers.push(`**L2 [mid flow]:** ${names}`);
  }

  const layer3 = connections.filter(c => c.in === 0 && c.out > 0).sort((a, b) => b.out - a.out).slice(0, 8);
  if (layer3.length > 0) {
    const names = layer3.map(n => `${n.file}(${n.out}↑)`).join(', ');
    layers.push(`**L3 [pure imports]:** ${names}${connections.filter(c => c.in === 0 && c.out > 0).length > 8 ? ` (+${connections.filter(c => c.in === 0 && c.out > 0).length - 8})` : ''}`);
  }

  return layers;
}

function buildModuleFlow(modules) {
  const sorted = Object.entries(modules)
    .filter(([_, data]) => data.in > 0 || data.out > 0)
    .sort((a, b) => {
      const aRatio = a[1].out > 0 ? a[1].in / a[1].out : 999;
      const bRatio = b[1].out > 0 ? b[1].in / b[1].out : 999;
      return bRatio - aRatio;
    });

  if (sorted.length === 0) return '';

  const exporters = sorted.filter(([_, d]) => d.in > d.out).slice(0, 3);
  const importers = sorted.filter(([_, d]) => d.out > d.in).slice(0, 3);
  const balanced = sorted.filter(([_, d]) => Math.abs(d.in - d.out) <= 2 && d.in > 0 && d.out > 0).slice(0, 2);

  const parts = [];
  if (exporters.length > 0) {
    parts.push(exporters.map(([name, d]) => `${name}(${d.out}↑${d.in}↓)`).join('→'));
  }
  if (balanced.length > 0) {
    parts.push(balanced.map(([name, d]) => `${name}(${d.out}↑${d.in}↓)`).join('↔'));
  }
  if (importers.length > 0) {
    parts.push(importers.map(([name, d]) => `${name}(${d.out}↑${d.in}↓)`).join('←'));
  }

  return parts.join(' | ');
}

function buildSpecificDependencies(depGraph, connections) {
  if (!depGraph?.edges || depGraph.edges.length === 0) return [];

  const depCounts = new Map();

  for (const edge of depGraph.edges) {
    const fromFile = edge.from.split('/').pop().replace(/\.\w+$/, '');
    const toFile = edge.to.split('/').pop().replace(/\.\w+$/, '');
    const key = `${fromFile}→${toFile}`;
    depCounts.set(key, (depCounts.get(key) || 0) + 1);
  }

  return Array.from(depCounts.entries())
    .filter(([_, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([dep]) => dep);
}

function analyzeCrossModuleDeps(depGraph, moduleStats) {
  const crossDeps = new Map();

  if (!depGraph?.edges) return [];

  for (const edge of depGraph.edges) {
    const fromModule = edge.from.split('/')[0] || 'root';
    const toModule = edge.to.split('/')[0] || 'root';

    if (fromModule !== toModule) {
      const key = `${fromModule}→${toModule}`;
      crossDeps.set(key, (crossDeps.get(key) || 0) + 1);
    }
  }

  return Array.from(crossDeps.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([dep, count]) => `${dep}(${count})`)
    .slice(0, 5);
}

// Get top external dependencies
function getTopExternalDeps(entities) {
  const externals = new Map();
  const internalPatterns = ['./', '../', '/src/', '/lib/', '/components/', '/utils/', '/services/', '/functions/'];

  for (const [lang, langEntities] of Object.entries(entities)) {
    for (const importStatement of langEntities.imports) {
      let packageName = null;
      if (importStatement.includes('from ')) {
        const match = importStatement.match(/from ['"]([^'"]+)['"]/);
        if (match) packageName = match[1];
      }

      if (packageName && !internalPatterns.some(pattern => packageName.includes(pattern))) {
        const isNodeModule = packageName.includes('node_modules') || !packageName.startsWith('.');
        if (isNodeModule && packageName.split('/').length <= 2) {
          externals.set(packageName.split('/').shift(), (externals.get(packageName.split('/').shift()) || 0) + 1);
        }
      }
    }
  }

  return Array.from(externals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);
}

function getCompactIssues(circular, duplicates, metrics, fileSizes, fileMetrics) {
  const issues = [];

  if (circular?.length > 0) {
    const cycleDesc = circular.slice(0, 2).map(cycle =>
      cycle.slice(0, 3).map(f => f.split('/').pop().replace(/\.\w+$/, '')).join('→')
    ).join(' | ');
    issues.push(`🔄 Circular: ${cycleDesc}${circular.length > 2 ? ` (+${circular.length - 2} cycles)` : ''}`);
  }

  if (duplicates?.length > 0) {
    const majorDupes = duplicates.filter(d => d.count >= 3).slice(0, 3);
    if (majorDupes.length > 0) {
      const dupeDesc = majorDupes.map(d => {
        const files = d.instances.slice(0, 2).map(inst => inst.file.split('/').pop()).join(', ');
        return `${files}(${d.count}×)`;
      }).join(' | ');
      issues.push(`📋 Duplication: ${dupeDesc}${duplicates.filter(d => d.count >= 3).length > 3 ? ` (+${duplicates.filter(d => d.count >= 3).length - 3})` : ''}`);
    }
  }

  const complexFuncs = [];
  for (const [file, data] of Object.entries(fileMetrics)) {
    if (data.functions) {
      for (const func of data.functions) {
        if (func.lines > 100) {
          complexFuncs.push({
            file: file.split('/').pop(),
            name: func.name,
            lines: func.lines,
            startLine: func.startLine
          });
        }
      }
    }
  }

  if (complexFuncs.length > 0) {
    complexFuncs.sort((a, b) => b.lines - a.lines);
    const funcList = complexFuncs.slice(0, 4).map(f => `${f.file}:${f.startLine}:${f.name}(${f.lines}L)`).join(', ');
    issues.push(`🔥 Complex funcs: ${funcList}${complexFuncs.length > 4 ? ` (+${complexFuncs.length - 4})` : ''}`);
  }

  const largeFiles = fileSizes?.largest?.filter(f => f.lines > 500);
  if (largeFiles?.length > 0) {
    const fileNames = largeFiles.slice(0, 3).map(f => `${f.file.split('/').pop()}:${f.lines}L`).join(', ');
    issues.push(`📁 Large files: ${fileNames}${largeFiles.length > 3 ? ` (+${largeFiles.length - 3})` : ''}`);
  }

  return issues;
}

function getFeatures(fileMetrics, identifiers) {
  const featureAreas = new Map();

  for (const [filePath, metrics] of Object.entries(fileMetrics)) {
    const fileName = filePath.split('/').pop().replace(/\.\w+$/, '');

    const keywords = [
      'auth', 'admin', 'marketplace', 'mcp', 'conversation', 'document',
      'streaming', 'server', 'client', 'api', 'test', 'tool', 'handler',
      'manager', 'provider', 'service', 'component', 'hook', 'util', 'config'
    ];

    for (const keyword of keywords) {
      if (fileName.toLowerCase().includes(keyword) || filePath.toLowerCase().includes(keyword)) {
        if (!featureAreas.has(keyword)) {
          featureAreas.set(keyword, { files: [], functions: 0, lines: 0 });
        }
        const area = featureAreas.get(keyword);
        area.files.push(filePath.split('/').pop());
        area.functions += metrics.functions?.length || 0;
        area.lines += metrics.loc || 0;
      }
    }
  }

  const sorted = Array.from(featureAreas.entries())
    .filter(([_, data]) => data.files.length >= 2)
    .sort((a, b) => b[1].lines - a[1].lines)
    .slice(0, 8);

  if (sorted.length === 0) return '';

  const featureList = sorted.map(([name, data]) => {
    const topFiles = [...new Set(data.files)].slice(0, 3).join(', ');
    return `**${name}:** ${data.files.length}f, ${data.functions}fn (${topFiles})`;
  }).join('\n');

  return featureList;
}

function getTechStack(entities, identifiers) {
  const stack = [];

  const topPatterns = [];
  for (const [lang, langEntities] of Object.entries(entities)) {
    if (langEntities.patterns && langEntities.patterns.size > 0) {
      const patterns = Array.from(langEntities.patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
      topPatterns.push(...patterns);
    }
  }

  const dedupedPatterns = new Map();
  topPatterns.forEach(([name, count]) => {
    dedupedPatterns.set(name, (dedupedPatterns.get(name) || 0) + count);
  });

  const sortedPatterns = Array.from(dedupedPatterns.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (sortedPatterns.length > 0) {
    const patternNames = sortedPatterns.map(([name, count]) => {
      const shortName = name.length > 20 ? name.slice(0, 17) + '...' : name;
      return `${shortName}(${count})`;
    }).join(', ');
    stack.push(`**Patterns:** ${patternNames}`);
  }

  const topIdentifiers = Array.from(identifiers.entries())
    .filter(([name]) => name.length >= 3 && name.length <= 25)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (topIdentifiers.length > 0) {
    const idNames = topIdentifiers.map(([name, count]) => `${name}(${count})`).join(', ');
    stack.push(`**Top IDs:** ${idNames}`);
  }

  return stack.join('\n');
}

function getCodeOrganization(fileSizes, funcLengths, funcParams, totalFn, totalCls, totalFiles, fileMetrics) {
  const org = [];

  if (fileSizes?.largest && fileSizes.largest.length > 0) {
    const largeFiles = fileSizes.largest.filter(f => f.lines >= 200).slice(0, 6);
    if (largeFiles.length > 0) {
      const fileList = largeFiles.map(f => `${f.file.split('/').pop()}:${f.lines}L`).join(', ');
      org.push(`**Large files:** ${fileList}${fileSizes.largest.filter(f => f.lines >= 200).length > 6 ? ` (+${fileSizes.largest.filter(f => f.lines >= 200).length - 6})` : ''}`);
    }
  }

  const longFunctions = [];
  for (const [file, metrics] of Object.entries(fileMetrics)) {
    if (metrics.functions) {
      for (const func of metrics.functions) {
        if (func.lines > 50) {
          longFunctions.push({
            file: file.split('/').pop(),
            name: func.name,
            lines: func.lines,
            startLine: func.startLine
          });
        }
      }
    }
  }

  if (longFunctions.length > 0) {
    longFunctions.sort((a, b) => b.lines - a.lines);
    const funcList = longFunctions.slice(0, 6).map(f => `${f.file}:${f.startLine}:${f.name}(${f.lines}L)`).join(', ');
    org.push(`**Long funcs:** ${funcList}${longFunctions.length > 6 ? ` (+${longFunctions.length - 6})` : ''}`);
  }

  const manyParamFuncs = [];
  for (const [file, metrics] of Object.entries(fileMetrics)) {
    if (metrics.functions) {
      for (const func of metrics.functions) {
        if (func.params > 5) {
          manyParamFuncs.push({
            file: file.split('/').pop(),
            name: func.name,
            params: func.params,
            startLine: func.startLine
          });
        }
      }
    }
  }

  if (manyParamFuncs.length > 0) {
    manyParamFuncs.sort((a, b) => b.params - a.params);
    const paramList = manyParamFuncs.slice(0, 6).map(f => `${f.file}:${f.startLine}:${f.name}(${f.params}p)`).join(', ');
    org.push(`**Many params:** ${paramList}${manyParamFuncs.length > 6 ? ` (+${manyParamFuncs.length - 6})` : ''}`);
  }

  const allClasses = [];
  for (const [file, metrics] of Object.entries(fileMetrics)) {
    if (metrics.classes && metrics.classes.length > 0) {
      for (const cls of metrics.classes) {
        allClasses.push({
          file: file.split('/').pop(),
          name: cls.name,
          startLine: cls.startLine
        });
      }
    }
  }

  if (allClasses.length > 0) {
    const classList = allClasses.slice(0, 8).map(c => `${c.file}:${c.startLine}:${c.name}`).join(', ');
    org.push(`**Classes:** ${classList}${allClasses.length > 8 ? ` (+${allClasses.length - 8})` : ''}`);
  }

  return org.join('\n');
}

function getAPISurface(entities, depGraph) {
  const surface = [];

  const allExports = [];
  const allClasses = [];

  for (const [lang, langEntities] of Object.entries(entities)) {
    if (langEntities.exports && langEntities.exports.size > 0) {
      allExports.push(...Array.from(langEntities.exports).slice(0, 10));
    }
    if (langEntities.classes && langEntities.classes.size > 0) {
      const classes = Array.from(langEntities.classes.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 8)
        .map(([name, data]) => `${name}(${data.count})`);
      allClasses.push(...classes);
    }
  }

  if (allExports.length > 0) {
    const topExports = allExports.slice(0, 6).map(e => {
      const short = e.length > 20 ? e.slice(0, 17) + '...' : e;
      return short;
    }).join(', ');
    surface.push(`**Exports:** ${topExports}${allExports.length > 6 ? ` (+${allExports.length - 6})` : ''}`);
  }

  if (allClasses.length > 0) {
    const topClasses = allClasses.slice(0, 6).join(', ');
    surface.push(`**Classes:** ${topClasses}${allClasses.length > 6 ? ` (+${allClasses.length - 6})` : ''}`);
  }

  if (depGraph?.entryPoints && depGraph.entryPoints.size > 0) {
    const entries = Array.from(depGraph.entryPoints)
      .slice(0, 5)
      .map(e => e.split('/').pop().replace(/\.\w+$/, ''))
      .join(', ');
    surface.push(`**Entry files:** ${entries}${depGraph.entryPoints.size > 5 ? ` (+${depGraph.entryPoints.size - 5})` : ''}`);
  }

  return surface.length > 0 ? surface.join('\n') : '';
}

function getModuleStructure(depGraph, totalFiles, fileSizes) {
  if (!depGraph?.coupling || totalFiles < 5) return [];

  const modules = new Map();
  let totalConnections = 0;

  for (const [file, coupling] of depGraph.coupling) {
    const module = file.split('/')[0] || 'root';
    if (!modules.has(module)) {
      modules.set(module, { files: 0, connections: 0, imports: 0, exports: 0, lines: 0 });
    }

    const mod = modules.get(module);
    mod.files++;
    mod.connections += coupling.in + coupling.out;
    mod.imports += coupling.out;
    mod.exports += coupling.in;
    totalConnections += coupling.in + coupling.out;
  }

  if (fileSizes?.largest) {
    for (const { file, lines } of fileSizes.largest) {
      const module = file.split('/')[0] || 'root';
      if (modules.has(module)) {
        modules.get(module).lines += lines;
      }
    }
  }

  return Array.from(modules.entries())
    .map(([name, data]) => ({
      name,
      ...data,
      pct: totalConnections > 0 ? (data.connections / totalConnections * 100).toFixed(0) : 0,
      avgLines: data.files > 0 ? Math.round(data.lines / data.files) : 0
    }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 6)
    .map(m => {
      const parts = [`${m.name}: ${m.files}f, ${m.connections}cx`];
      if (m.avgLines > 0) parts.push(`~${m.avgLines}L/f`);
      if (m.imports > 0) parts.push(`${m.imports}↑`);
      if (m.exports > 0) parts.push(`${m.exports}↓`);
      return parts.join(', ');
    });
}

// Check if file is obviously an entry point
function isObviousEntryPoint(filename) {
  const entryPatterns = [
    'index.', 'main.', 'app.', 'server.', 'client.', 'start.',
    'cli.', 'bin.', 'boot.', 'init.', 'entry.'
  ];
  return entryPatterns.some(pattern => filename.includes(pattern));
}

// Analyze the import/export flow pattern
function analyzeFlowPattern(connections, entries) {
  if (connections.length < 3) return '';

  const totalImports = connections.reduce((sum, c) => sum + c.in, 0);
  const totalExports = connections.reduce((sum, c) => sum + c.out, 0);

  // Determine the dominant flow pattern
  if (entries.length >= 2) {
    return 'Multi-entry system';
  } else if (entries.length === 1) {
    const hubCount = connections.filter(c => c.total >= 5).length;
    if (hubCount >= 2) {
      return 'Hub-and-spoke architecture';
    } else {
      return 'Linear flow system';
    }
  } else {
    // No clear entry points
    const highlyConnected = connections.filter(c => c.total >= 5).length;
    if (highlyConnected > 0) {
      return 'Decentralized modules';
    } else {
      return 'Isolated components';
    }
  }
}

function getProjectInfo(projectContext) {
  if (!projectContext) return '';

  const parts = [];

  if (projectContext.framework) {
    parts.push(`${projectContext.framework} ${projectContext.type || 'app'}`);
  } else if (projectContext.runtime) {
    parts.push(`${projectContext.runtime} app`);
  }

  if (projectContext.entry) {
    parts.push(`| Start: \`${projectContext.entry}\``);
  }

  if (projectContext.build) {
    parts.push(`| Build: \`${projectContext.build}\``);
  }

  const deps = Object.keys(projectContext.dependencies || {});
  const keyDeps = [];
  if (deps.includes('express')) keyDeps.push('Express');
  if (deps.includes('fastify')) keyDeps.push('Fastify');
  if (deps.includes('@supabase/supabase-js')) keyDeps.push('Supabase');
  if (deps.includes('firebase')) keyDeps.push('Firebase');
  if (deps.includes('prisma')) keyDeps.push('Prisma');
  if (deps.includes('mongoose')) keyDeps.push('MongoDB');

  if (keyDeps.length > 0) {
    parts.push(`| Deps: ${keyDeps.join(', ')}`);
  }

  return parts.join(' ');
}

function getDeadCodeSection(deadCode) {
  if (!deadCode) return '';

  const sections = [];

  if (deadCode.testFiles?.length > 0) {
    const testList = deadCode.testFiles.slice(0, 6).map(f => f.split('/').pop()).join(', ');
    sections.push(`**Test files:** ${testList}${deadCode.testFiles.length > 6 ? ` (+${deadCode.testFiles.length - 6})` : ''}`);
  }

  if (deadCode.unusedExports?.length > 0) {
    const unusedList = deadCode.unusedExports.slice(0, 4).map(item => {
      const fileName = item.file.split('/').pop();
      const exports = item.exports.join(', ');
      return `${fileName}(${exports})`;
    }).join(', ');
    sections.push(`**Unused exports:** ${unusedList}${deadCode.unusedExports.length > 4 ? ` (+${deadCode.unusedExports.length - 4})` : ''}`);
  }

  if (deadCode.orphanedFiles?.length > 0) {
    const orphanList = deadCode.orphanedFiles.slice(0, 6).map(f => f.split('/').pop()).join(', ');
    sections.push(`**Orphaned:** ${orphanList}${deadCode.orphanedFiles.length > 6 ? ` (+${deadCode.orphanedFiles.length - 6})` : ''}`);
  }

  if (deadCode.possiblyDead?.length > 0) {
    const possiblyList = deadCode.possiblyDead.slice(0, 3).map(item => {
      const fileName = item.file.split('/').pop();
      const usedBy = item.usedBy.split('/').pop();
      return `${fileName}←${usedBy}`;
    }).join(', ');
    sections.push(`**Single use:** ${possiblyList}${deadCode.possiblyDead.length > 3 ? ` (+${deadCode.possiblyDead.length - 3})` : ''}`);
  }

  return sections.join('\n');
}

function k(num) {
  return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num;
}