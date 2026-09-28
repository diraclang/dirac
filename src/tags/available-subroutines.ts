/**
 * <available-subroutines> tag - list available nested subroutines
 * Returns all subroutines within current call boundary with their metadata
 */

import type { DiracSession, DiracElement } from '../types/index.js';

export async function executeAvailableSubroutines(
  session: DiracSession,
  element: DiracElement
): Promise<void> {
  // Get all subroutines from current boundary to top of stack
  const availableSubroutines = new Map<string, DiracElement>();
  
  // Get the name of the currently executing subroutine from BEFORE the boundary
  // The boundary marks where NEW subroutines start, so the current one is at boundary-1
  const currentSubroutineName = session.subBoundary > 0 && session.subBoundary <= session.subroutines.length
    ? session.subroutines[session.subBoundary - 1].name
    : null;
  
  // Read from top of stack (most recent) backwards to boundary
  // This ensures we get the latest definition (handles extends override)
  for (let i = session.subroutines.length - 1; i >= session.subBoundary; i--) {
    const sub = session.subroutines[i];
    
    // Skip the currently executing subroutine itself
    if (sub.name === currentSubroutineName) {
      continue;
    }
    
    // Only add if not already seen (first occurrence wins)
    if (!availableSubroutines.has(sub.name)) {
      availableSubroutines.set(sub.name, sub.element);
    }
  }
  
  // Generate unified structured output with calling guidance.
  const lines: string[] = [
    '<!-- Dirac Subroutine Interface (source=memory, scope=available) -->',
    '<!-- Call convention: use direct tag call -->',
    '<!-- Generic form: <subroutineName required1="..." required2="..." optional1="..." /> -->',
    `<subroutines source="memory" scope="available" total="${availableSubroutines.size}">`,
  ];
  
  for (const [name, subElement] of availableSubroutines) {
    const attrs: string[] = [`name="${escapeXml(name)}"`];

    lines.push(`  <!-- Sample call: ${buildSampleCallFromElement(name, subElement)} -->`);
    
    // Add description if available
    const description = subElement.attributes.description;
    if (description) {
      attrs.push(`description="${escapeXml(description)}"`);
    }
    
    // Add all param-* attributes with their definitions
    for (const [attrName, attrValue] of Object.entries(subElement.attributes)) {
      if (attrName.startsWith('param-')) {
        attrs.push(`${attrName}="${escapeXml(attrValue)}"`);
      }
    }
    
    // Build the output tag
    const attrString = attrs.join(' ');
    lines.push(`  <subroutine ${attrString} />`);
  }
  
  lines.push('</subroutines>');
  session.output.push(lines.join('\n'));
}

function buildSampleCallFromElement(name: string, subElement: DiracElement): string {
  const requiredAttrs: string[] = [];

  for (const [attrName, attrValue] of Object.entries(subElement.attributes)) {
    if (!attrName.startsWith('param-')) continue;

    const paramName = attrName.slice(6);
    const parts = String(attrValue).split(':');
    const type = parts[0] || 'string';
    const required = parts.some((part) => part.trim().toLowerCase() === 'required');

    if (required) {
      requiredAttrs.push(`${paramName}="${sampleValueForType(type)}"`);
    }
  }

  return requiredAttrs.length > 0
    ? `<${name} ${requiredAttrs.join(' ')} />`
    : `<${name} />`;
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
