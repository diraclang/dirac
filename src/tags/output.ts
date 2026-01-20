/**
 * <output> tag - emit content
 * Maps to mask_tag_output in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit, substituteVariables } from '../runtime/session.js';
import { integrateChildren } from '../runtime/interpreter.js';

export async function executeOutput(session: DiracSession, element: DiracElement): Promise<void> {
  // If has text content, use it (with variable substitution)
  if (element.text) {
    const content = substituteVariables(session, element.text);
    emit(session, content);
    return;
  }
  
  // Otherwise, process children to build content
  await integrateChildren(session, element);
}
