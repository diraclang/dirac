/**
 * <parameters> tag - Access parameters passed to subroutine
 * Maps to MASK parameter selection syntax
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { getCurrentParameters, emit, setVariable } from '../runtime/session.js';
import { integrate } from '../runtime/interpreter.js';

export async function executeParameters(session: DiracSession, element: DiracElement): Promise<void> {
  const select = element.attributes.select;
  
  if (!select) {
    throw new Error('<parameters> requires select attribute');
  }
  
  // Get parameters from current call context
  const params = getCurrentParameters(session);
  
  if (!params || params.length === 0) {
    if (session.debug) {
      console.error(`[PARAMETERS] No parameters available`);
    }
    return;
  }
  
  // The caller element is params[0] (the calling tag itself)
  const caller = params[0];
  
  if (select === '*') {
    // Select all child elements - execute them
    if (session.debug) {
      console.error(`[PARAMETERS] Selecting all children (${caller.children.length} elements)`);
    }
    
    for (const child of caller.children) {
      await integrate(session, child);
    }
    
  } else if (select.startsWith('@')) {
    // Select attribute(s)
    const attrName = select.slice(1); // Remove '@'
    
    if (attrName === '*') {
      // Select all attributes
      if (session.debug) {
        console.error(`[PARAMETERS] Selecting all attributes`);
      }
      
      const attrs = Object.entries(caller.attributes)
        .map(([key, val]) => `${key}="${val}"`)
        .join(' ');
      emit(session, attrs);
      
    } else {
      // Select specific attribute - automatically create variable with that name
      const value = caller.attributes[attrName];
      
      if (session.debug) {
        console.error(`[PARAMETERS] Setting variable '${attrName}' = '${value}'`);
      }
      
      if (value !== undefined) {
        // Automatically create variable (like defvar)
        setVariable(session, attrName, value, false);
      }
      
      // Execute children if any (for additional processing)
      for (const child of element.children) {
        await integrate(session, child);
      }
    }
    
  } else {
    throw new Error(`<parameters> invalid select: ${select}`);
  }
}
