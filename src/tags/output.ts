/**
 * <output> tag - emit content
 * Maps to mask_tag_output in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit, substituteVariables } from '../runtime/session.js';
import { integrateChildren } from '../runtime/interpreter.js';

export async function executeOutput(session: DiracSession, element: DiracElement): Promise<void> {
  // If has children, process them (handles mixed content)
  if (element.children && element.children.length > 0) {
    await integrateChildren(session, element);
    return;
  }
  
  // If only text content, use it (with variable substitution)
  if (element.text) {
    const content = substituteVariables(session, element.text);
    emit(session, content);
    return;
  }
}
