/**
 * <try> tag - establishes exception boundary
 * Maps to mask_try_integrate in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { setExceptionBoundary, unsetExceptionBoundary } from '../runtime/session.js';

export async function executeTry(session: DiracSession, element: DiracElement): Promise<void> {
  // Set exception boundary (mark the start of try block)
  setExceptionBoundary(session);
  
  // Execute children (the try block content)
  const { integrateChildren } = await import('../runtime/interpreter.js');
  await integrateChildren(session, element);
  
  // Unset boundary after execution
  unsetExceptionBoundary(session);
}
