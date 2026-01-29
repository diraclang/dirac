/**
 * <defvar> tag - define variable
 * Maps to mask_tag_defvar in MASK
 */


import type { DiracSession, DiracElement } from '../types/index.js';
import { setVariable, substituteVariables } from '../runtime/session.js';
import { integrate } from '../runtime/interpreter.js';
import { executeParameters } from './parameters.js';

export async function executeDefvar(session: DiracSession, element: DiracElement): Promise<void> {
  const name = element.attributes.name;
  const valueAttr = element.attributes.value;
  const visibleAttr = element.attributes.visible || 'false';
  const literal = 'literal' in element.attributes;

  if (!name) {
    throw new Error('<defvar> requires name attribute');
  }

  // Determine visibility
  const visible = visibleAttr === 'true' || visibleAttr === 'variable' || visibleAttr === 'both';

  let value: any;
  if (valueAttr !== undefined) {
    value = substituteVariables(session, valueAttr);
  } else if (literal) {
    // Literal mode: take text or XML as-is
    if (element.text) {
      value = substituteVariables(session, element.text);
    } else {
      value = '';
    }
  } else if (element.children && element.children.length > 0) {
    // If the first child is a <parameters> tag, call and assign its return value
    if (element.children.length === 1 && element.children[0].tag && element.children[0].tag.toLowerCase() === 'parameters') {
      value = await executeParameters(session, element.children[0]);
    } else {
      // Otherwise, execute all children and capture output
      const prevOutput = session.output;
      session.output = [];
      for (const child of element.children) {
        await integrate(session, child);
      }
      value = session.output.join('');
      session.output = prevOutput;
    }
  } else if (element.text) {
    value = substituteVariables(session, element.text);
  } else {
    value = '';
  }

  setVariable(session, name, value, visible);
}
