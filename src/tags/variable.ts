/**
 * <variable> tag - retrieve variable value
 * Outputs the stored variable content (text or tags)
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { getVariable, emit } from '../runtime/session.js';

export function executeVariable(session: DiracSession, element: DiracElement): void {
  const name = element.attributes.name;
  if (!name) {
    // Debug: print the full element for diagnosis
    console.error('[VariableTagError] <variable> tag missing name attribute:', JSON.stringify(element));
    throw new Error('<variable> requires name attribute');
  }
  const value = getVariable(session, name);
  if (value === undefined) {
    if (session.debug) {
      console.error(`[Warning] Variable '${name}' is undefined`);
    }
    return;
  }
  // Output the variable value
  emit(session, String(value));
}
