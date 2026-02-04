/**
 * <exception> tag - outputs currently caught exceptions
 * Maps to mask_exception_integrate in MASK
 * Used inside <catch> blocks to access exception content
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { getCurrentExceptions } from '../runtime/session.js';

export async function executeException(session: DiracSession, element: DiracElement): Promise<void> {
  // Get the currently caught exceptions
  const exceptions = getCurrentExceptions(session);
  
  // Process each exception DOM element's children
  const { integrateChildren } = await import('../runtime/interpreter.js');
  for (const exceptionDom of exceptions) {
    // Execute the children of the exception (the exception content)
    await integrateChildren(session, exceptionDom);
  }
}
