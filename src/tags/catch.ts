/**
 * <catch> tag - catches exceptions by name
 * Maps to mask_catch_integrate in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { lookupException, flushCurrentException } from '../runtime/session.js';

export async function executeCatch(session: DiracSession, element: DiracElement): Promise<void> {
  // Get exception name from 'name' attribute (default to "exception")
  const exceptionName = element.attributes?.name || 'exception';
  
  // Look up matching exceptions between current position and last boundary
  const caughtCount = lookupException(session, exceptionName);
  
  // If exceptions were caught, execute the catch block
  if (caughtCount > 0) {
    const { integrateChildren } = await import('../runtime/interpreter.js');
    await integrateChildren(session, element);
  }
  
  // Flush current exceptions after processing
  flushCurrentException(session);
}
