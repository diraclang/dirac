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

// Singleton registry instance shared across all tags
export const registry = new SubroutineRegistry();

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
  const format = element.attributes.format || 'xml';
  
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
      output = '<!-- Dirac Subroutine Interface (source=disk, scope=all) -->\n';
      output += '<!-- Call convention: use direct tag call -->\n';
      output += '<!-- Generic form: <subroutineName required1="..." required2="..." optional1="..." /> -->\n';
      output += `<subroutines source="disk" scope="all" query="${escapeXml(query)}" total="${results.length}">\n`;
      for (const sub of results) {
        const attrs: string[] = [`name="${escapeXml(sub.name)}"`];
        if (sub.description) {
          attrs.push(`description="${escapeXml(sub.description)}"`);
        }
        for (const param of sub.parameters) {
          const metadata = [param.type || 'any'];
          if (param.required) metadata.push('required');
          if (param.description) metadata.push(param.description);
          attrs.push(`param-${param.name}="${escapeXml(metadata.join(':'))}"`);
        }
        attrs.push(`file="${escapeXml(sub.filePath)}"`);

        output += `  <!-- Sample call: ${buildSampleCallFromMetadata(sub)} -->\n`;
        output += `  <subroutine ${attrs.join(' ')} />\n`;
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

function buildSampleCallFromMetadata(sub: any): string {
  const attrs: string[] = [];
  const params = Array.isArray(sub.parameters) ? sub.parameters : [];

  for (const param of params) {
    if (!param.required) continue;
    attrs.push(`${param.name}="${sampleValueForType(param.type)}"`);
  }

  return attrs.length > 0
    ? `<${sub.name} ${attrs.join(' ')} />`
    : `<${sub.name} />`;
}

function sampleValueForType(type?: string): string {
  switch ((type || '').toLowerCase()) {
    case 'number':
    case 'integer':
    case 'float':
      return '1';
    case 'boolean':
      return 'true';
    case 'json':
    case 'object':
      return '{}';
    default:
      return 'value';
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
