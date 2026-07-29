/**
 * <session-log> tag - output the current session.output buffer
 * Useful for debugging and inspecting what's in the output buffer
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit, substituteAttribute } from '../runtime/session.js';

export async function executeSessionLog(session: DiracSession, element: DiracElement): Promise<void> {
  const format = substituteAttribute(session, element.attributes.format || 'text');
  const boundary = element.attributes.boundary === 'true';
  
  // Determine what to output based on boundary attribute
  const outputArray = boundary 
    ? session.output.slice(session.outputBoundary) // From current boundary
    : session.output; // Entire buffer
  
  switch (format) {
    case 'json':
      // Output as JSON array
      emit(session, JSON.stringify(outputArray, null, 2));
      break;
      
    case 'array':
      // Output as numbered list (for debugging)
      if (outputArray.length === 0) {
        emit(session, '[Empty output buffer]');
      } else {
        outputArray.forEach((item, index) => {
          const start = boundary ? session.outputBoundary + index : index;
          emit(session, `[${start}] ${JSON.stringify(item)}\n`);
        });
      }
      break;
      
    case 'count':
      // Just output the count
      emit(session, outputArray.length.toString());
      break;
      
    case 'text':
    default:
      // Output as plain joined text (default)
      if (outputArray.length === 0) {
        emit(session, '[Empty output buffer]');
      } else {
        emit(session, outputArray.join(''));
      }
      break;
  }
}
