/**
 * <loop> tag - iteration
 * Maps to mask_tag_loop in MASK
 * 
 * Usage:
 *   <loop count="5">...</loop>                 - loops 5 times, var 'i' = 0..4
 *   <loop count="${n}" var="idx">...</loop>    - loops n times, var 'idx' = 0..n-1
 * 
 * Attributes:
 *   count - number of iterations (supports variable substitution: count="${n}")
 *   var   - loop variable name (default: 'i')
 * 
 * Loop Control:
 *   <break /> - exit loop early (use with <test-if> for conditional loops)
 * 
 * Note: For while-loop behavior, use <test-if> + <break>:
 *   <loop count="1000">
 *     <test-if test="$done" eq="true"><break /></test-if>
 *     <!-- loop body -->
 *   </loop>
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { setVariable, substituteAttribute } from '../runtime/session.js';
import { integrateChildren } from '../runtime/interpreter.js';

export async function executeLoop(session: DiracSession, element: DiracElement): Promise<void> {
  const countAttr = element.attributes.count;
  const varName = element.attributes.var || 'i';
  
  if (!countAttr) {
    throw new Error('<loop> requires count attribute. For conditional loops, use <test-if> with <break>.');
  }
  
  const substitutedCount = substituteAttribute(session, countAttr);
  const count = parseInt(substitutedCount, 10);
  
  if (isNaN(count) || count < 0) {
    throw new Error(`Invalid loop count: ${countAttr} (evaluated to: ${substitutedCount})`);
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
