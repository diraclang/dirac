/**
 * <assign> tag - assign value to existing variable
 * Maps to mask_tag_assign in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { getVariable, setVariable, substituteVariables } from '../runtime/session.js';

export function executeAssign(session: DiracSession, element: DiracElement): void {
  const name = element.attributes.name;
  const valueAttr = element.attributes.value;
  
  if (!name) {
    throw new Error('<assign> requires name attribute');
  }
  
  // Get value
  let value: any;
  if (valueAttr !== undefined) {
    value = substituteVariables(session, valueAttr);
  } else if (element.text) {
    value = substituteVariables(session, element.text);
  } else {
    value = '';
  }
  
  // Find existing variable and update it
  for (let i = session.variables.length - 1; i >= 0; i--) {
    if (session.variables[i].name === name) {
      session.variables[i].value = value;
      return;
    }
  }
  
  // Variable not found - create it (same as MASK behavior)
  setVariable(session, name, value, false);
}
