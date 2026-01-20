/**
 * <defvar> tag - define variable
 * Maps to mask_tag_defvar in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { setVariable, substituteVariables } from '../runtime/session.js';

export function executeDefvar(session: DiracSession, element: DiracElement): void {
  const name = element.attributes.name;
  const valueAttr = element.attributes.value;
  const visibleAttr = element.attributes.visible || 'false';
  
  if (!name) {
    throw new Error('<defvar> requires name attribute');
  }
  
  // Determine visibility
  const visible = visibleAttr === 'true' || visibleAttr === 'variable' || visibleAttr === 'both';
  
  // Get value (from attribute or text content)
  let value: any;
  if (valueAttr !== undefined) {
    value = substituteVariables(session, valueAttr);
  } else if (element.text) {
    value = substituteVariables(session, element.text);
  } else {
    value = '';
  }
  
  setVariable(session, name, value, visible);
}
