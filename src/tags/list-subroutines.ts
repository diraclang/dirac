/**
 * <list-subroutines> tag - List ALL subroutines in current session/stack
 * Shows global view of all registered subroutines with their parameters
 * 
 * Different from <available-subroutines> which shows nested/child subroutines
 * within current call boundary (like methods of a class)
 * 
 * Usage:
 *   <list-subroutines/>  - outputs to session
 *   <list-subroutines format="text"/>  - human-readable format (default)
 *   <list-subroutines format="braket"/>  - bra-ket notation
 *   <list-subroutines format="xml"/>  - XML format
 *   <list-subroutines output="var"/>  - store in variable instead of outputting
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { getAvailableSubroutines, emit, setVariable } from '../runtime/session.js';

export async function executeListSubroutines(session: DiracSession, element: DiracElement): Promise<void> {
  const format = element.attributes.format || 'text';
  const outputVar = element.attributes.output;
  
  const subroutines = getAvailableSubroutines(session);
  
  let output = '';
  
  switch (format) {
    case 'braket':
      output = formatAsBraKet(subroutines);
      break;
    case 'xml':
      output = formatAsXml(subroutines);
      break;
    case 'json':
      output = JSON.stringify(subroutines, null, 2);
      break;
    case 'text':
    default:
      output = formatAsText(subroutines);
      break;
  }
  
  if (outputVar) {
    setVariable(session, outputVar, output, false);
  } else {
    emit(session, output);
  }
}

function formatAsBraKet(subroutines: any[]): string {
  const lines: string[] = ['Available subroutines:\n'];
  
  for (const sub of subroutines) {
    // Format: <name param1=type param2=type|
    const params = sub.parameters?.map((p: any) => 
      `${p.name}=${p.type || 'any'}`
    ).join(' ') || '';
    
    const braLine = params 
      ? `<${sub.name} ${params}|`
      : `<${sub.name}|`;
    
    lines.push(braLine);
    
    if (sub.description) {
      lines.push(`  ${sub.description}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

function formatAsXml(subroutines: any[]): string {
  const lines: string[] = ['Available subroutines:\n'];
  
  for (const sub of subroutines) {
    const params = sub.parameters?.map((p: any) => 
      `param-${p.name}="${p.type || 'any'}"`
    ).join(' ') || '';
    
    const xmlLine = params
      ? `<subroutine name="${sub.name}" ${params}/>`
      : `<subroutine name="${sub.name}"/>`;
    
    lines.push(xmlLine);
    
    if (sub.description) {
      lines.push(`  <!-- ${sub.description} -->`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

function formatAsText(subroutines: any[]): string {
  const lines: string[] = ['Available subroutines:\n'];
  
  for (const sub of subroutines) {
    lines.push(`${sub.name}(`);
    
    if (sub.parameters && sub.parameters.length > 0) {
      for (const param of sub.parameters) {
        const required = param.required ? ' [required]' : '';
        const desc = param.description ? ` - ${param.description}` : '';
        lines.push(`  ${param.name}: ${param.type || 'any'}${required}${desc}`);
      }
    }
    
    lines.push(`)${sub.description ? ' - ' + sub.description : ''}\n`);
  }
  
  return lines.join('\n');
}
