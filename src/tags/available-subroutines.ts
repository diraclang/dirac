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
  
  // Read from top of stack (most recent) backwards to boundary
  // This ensures we get the latest definition (handles extends override)
  for (let i = session.subroutines.length - 1; i >= session.subBoundary; i--) {
    const sub = session.subroutines[i];
    
    // Only add if not already seen (first occurrence wins)
    if (!availableSubroutines.has(sub.name)) {
      availableSubroutines.set(sub.name, sub.element);
    }
  }
  
  // Generate output for each subroutine
  for (const [name, subElement] of availableSubroutines) {
    const attrs: string[] = [];
    
    // Add description if available
    const description = subElement.attributes.description;
    if (description) {
      attrs.push(`description="${escapeXml(description)}"`);
    }
    
    // Add all param-* attributes with their definitions
    for (const [attrName, attrValue] of Object.entries(subElement.attributes)) {
      if (attrName.startsWith('param-')) {
        const paramName = attrName.substring(6);
        attrs.push(`${paramName}="${escapeXml(attrValue)}"`);
      }
    }
    
    // Build the output tag
    const attrString = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    session.output.push(`<${name}${attrString} />`);
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
