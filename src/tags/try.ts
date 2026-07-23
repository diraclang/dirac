/**
 * <try> tag - establishes exception boundary
 * Maps to mask_try_integrate in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { setExceptionBoundary, unsetExceptionBoundary } from '../runtime/session.js';

export async function executeTry(session: DiracSession, element: DiracElement): Promise<void> {
  // Set exception boundary (mark the start of try block)
  setExceptionBoundary(session);
  
  // Separate catch blocks from regular children
  const regularChildren: DiracElement[] = [];
  const catchBlocks: DiracElement[] = [];
  
  for (const child of element.children) {
    if (child.tag === 'catch') {
      catchBlocks.push(child);
    } else {
      regularChildren.push(child);
    }
  }
  
  // Execute regular children (the try block content)
  const { integrate } = await import('../runtime/interpreter.js');
  for (const child of regularChildren) {
    await integrate(session, child);
    if (session.isReturn || session.isBreak || session.isThrown) break;
  }
  
  // If an exception was thrown, clear the flag and execute catch blocks
  if (session.isThrown) {
    session.isThrown = false;
    
    // Execute catch blocks
    for (const catchBlock of catchBlocks) {
      await integrate(session, catchBlock);
    }
  }
  
  // Unset boundary after execution
  unsetExceptionBoundary(session);
}
