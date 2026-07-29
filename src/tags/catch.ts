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
    
    // Remove caught exceptions from the exception stack
    const originalLength = session.exceptions.length;
    session.exceptions = session.exceptions.filter((exc) => {
      // Remove matching exceptions with isBoundary === 0
      if (exc.isBoundary === 0 && exc.name === exceptionName) {
        return false;
      }
      return true;
    });
    
    if (session.debug && originalLength !== session.exceptions.length) {
      console.error(`[catch] Removed ${originalLength - session.exceptions.length} exception(s) named '${exceptionName}'`);
    }
  }
  
  // Flush current exceptions after processing
  flushCurrentException(session);
}
