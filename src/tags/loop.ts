/**
 * <loop> tag - iteration
 * Maps to mask_tag_loop in MASK
 * 
 * Usage:
 *   <loop count="5">...</loop>           - loops 5 times, var 'i' = 0..4
 *   <loop count="3" var="idx">...</loop> - loops 3 times, var 'idx' = 0..2
 * 
 * Attributes:
 *   count - number of iterations (literal number only, not variable substitution)
 *   var   - loop variable name (default: 'i')
 * 
 * Loop Control:
 *   <break /> - exit loop early
 * 
 * Note: count attribute does NOT support variable substitution (e.g., count="${n}")
 *       Use literal numbers only. For dynamic iteration, use <foreach> instead.
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { setVariable, substituteVariables, getVariable } from '../runtime/session.js';
import { integrateChildren } from '../runtime/interpreter.js';

export async function executeLoop(session: DiracSession, element: DiracElement): Promise<void> {
  const countAttr = element.attributes.count;
  const varName = element.attributes.var || 'i';
  
  if (!countAttr) {
    throw new Error('<loop> requires count attribute');
  }
  
  const count = parseInt(substituteVariables(session, countAttr), 10);
  
  if (isNaN(count) || count < 0) {
    throw new Error(`Invalid loop count: ${countAttr}`);
  }
  
  const wasBreak = session.isBreak;
  session.isBreak = false;
  
  for (let i = 0; i < count; i++) {
    setVariable(session, varName, i, false);
    
    await integrateChildren(session, element);
    
    if (session.isBreak) {
      session.isBreak = false;
      break;
    }
    
    if (session.isReturn) {
      break;
    }
  }
  
  session.isBreak = wasBreak;
}
