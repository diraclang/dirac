/**
 * <throw> tag - throws an exception
 * Maps to mask_throw_integrate in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { throwException } from '../runtime/session.js';

export async function executeThrow(session: DiracSession, element: DiracElement): Promise<void> {
  // Get exception name from 'name' attribute (default to "exception")
  const exceptionName = element.attributes?.name || 'exception';
  
  // Process children to build exception content
  const { integrateChildren } = await import('../runtime/interpreter.js');
  
  // Create a wrapper element to capture the processed content
  const exceptionDom: DiracElement = {
    tag: 'exception-content',
    attributes: { name: exceptionName },
    children: element.children,
    text: element.text,
  };
  
  // Throw the exception (add to exception stack)
  throwException(session, exceptionName, exceptionDom);
}
