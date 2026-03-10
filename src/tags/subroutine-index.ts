/**
 * <index-subroutines> tag - Index subroutines from files/directories
 * <search-subroutines> tag - Search indexed subroutines semantically
 * 
 * Usage:
 *   <index-subroutines path="../dirac-stdlib" />
 *   <search-subroutines query="create a greeting" limit="5" output="results" />
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit, setVariable } from '../runtime/session.js';
import { SubroutineRegistry } from '../runtime/subroutine-registry.js';

const registry = new SubroutineRegistry();

export async function executeIndexSubroutines(session: DiracSession, element: DiracElement): Promise<void> {
  const pathAttr = element.attributes.path;
  
  if (!pathAttr) {
    throw new Error('<index-subroutines> requires path attribute');
  }
  
  const count = await registry.indexDirectory(pathAttr);
  
  if (session.debug) {
    emit(session, `Indexed ${count} subroutines from ${pathAttr}\n`);
  }
}

export async function executeSearchSubroutines(session: DiracSession, element: DiracElement): Promise<void> {
  const query = element.attributes.query;
  const limitAttr = element.attributes.limit;
  const outputVar = element.attributes.output;
  const format = element.attributes.format || 'text';
  
  if (!query) {
    throw new Error('<search-subroutines> requires query attribute');
  }
  
  const limit = limitAttr ? parseInt(limitAttr, 10) : 10;
  const results = registry.search(query, limit);
  
  let output = '';
  
  switch (format) {
    case 'json':
      output = JSON.stringify(results, null, 2);
      break;
      
    case 'xml':
      output = '<subroutines>\n';
      for (const sub of results) {
        const params = sub.parameters.map(p => `param-${p.name}="${p.type}"`).join(' ');
        output += `  <subroutine name="${sub.name}" ${params} file="${sub.filePath}"/>\n`;
        if (sub.description) {
          output += `    <!-- ${sub.description} -->\n`;
        }
      }
      output += '</subroutines>';
      break;
      
    case 'text':
    default:
      if (results.length === 0) {
        output = 'No subroutines found.\n';
      } else {
        output = `Found ${results.length} subroutine(s):\n\n`;
        for (const sub of results) {
          output += `${sub.name}(${sub.parameters.map(p => p.name).join(', ')})\n`;
          if (sub.description) {
            output += `  ${sub.description}\n`;
          }
          output += `  File: ${sub.filePath}\n\n`;
        }
      }
      break;
  }
  
  if (outputVar) {
    setVariable(session, outputVar, output, false);
  } else {
    emit(session, output);
  }
}

export async function executeRegistryStats(session: DiracSession, element: DiracElement): Promise<void> {
  const stats = registry.getStats();
  const output = `Subroutine Registry Statistics:
  Total Subroutines: ${stats.totalSubroutines}
  Total Files: ${stats.totalFiles}
  Last Updated: ${stats.lastUpdated.toLocaleString()}
`;
  
  emit(session, output);
}
