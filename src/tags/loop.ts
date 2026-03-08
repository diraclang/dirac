/**
 * <loop> tag - iteration
 * Maps to mask_tag_loop in MASK
 * 
 * Usage:
 *   <loop count="5">...</loop>                    - loops 5 times, var 'i' = 0..4
 *   <loop count="${n}" var="idx">...</loop>       - loops n times, var 'idx' = 0..n-1
 *   <loop condition="${running}">...</loop>       - while-loop style, continues while condition is true
 *   <loop count="10" condition="${notDone}">...</loop> - max 10 iterations, but stops if condition false
 * 
 * Attributes:
 *   count     - number of iterations (supports variable substitution: count="${n}")
 *   condition - boolean expression to evaluate each iteration (optional)
 *   var       - loop variable name (default: 'i')
 * 
 * Loop Control:
 *   <break /> - exit loop early
 * 
 * If both count and condition are provided, loop stops when either limit is reached.
 * If only condition is provided, loops indefinitely until condition becomes false.
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { setVariable, substituteAttribute, getVariable } from '../runtime/session.js';
import { integrateChildren } from '../runtime/interpreter.js';

export async function executeLoop(session: DiracSession, element: DiracElement): Promise<void> {
  const countAttr = element.attributes.count;
  const conditionAttr = element.attributes.condition;
  const varName = element.attributes.var || 'i';
  
  // Must have either count or condition
  if (!countAttr && !conditionAttr) {
    throw new Error('<loop> requires either count or condition attribute');
  }
  
  // Parse count if provided
  let maxIterations = Infinity;
  if (countAttr) {
    const substitutedCount = substituteAttribute(session, countAttr);
    const count = parseInt(substitutedCount, 10);
    
    if (isNaN(count) || count < 0) {
      throw new Error(`Invalid loop count: ${countAttr} (evaluated to: ${substitutedCount})`);
    }
    maxIterations = count;
  }
  
  const wasBreak = session.isBreak;
  session.isBreak = false;
  
  let i = 0;
  while (i < maxIterations) {
    // Check condition if provided
    if (conditionAttr) {
      const substitutedCondition = substituteAttribute(session, conditionAttr);
      const conditionValue = evaluateCondition(session, substitutedCondition);
      
      if (!conditionValue) {
        break; // Condition is false, exit loop
      }
    }
    
    setVariable(session, varName, i, false);
    
    await integrateChildren(session, element);
    
    if (session.isBreak) {
      session.isBreak = false;
      break;
    }
    
    if (session.isReturn) {
      break;
    }
    
    i++;
  }
  
  session.isBreak = wasBreak;
}

/**
 * Evaluate a condition expression
 * Supports: variable references, boolean literals, simple comparisons
 */
function evaluateCondition(session: DiracSession, condition: string): boolean {
  const trimmed = condition.trim();
  
  // Boolean literals
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  
  // Variable reference (already substituted by substituteAttribute)
  // At this point it's either "true", "false", or a truthy value
  if (trimmed === '1' || trimmed.toLowerCase() === 'yes') return true;
  if (trimmed === '0' || trimmed === '' || trimmed.toLowerCase() === 'no') return false;
  
  // For any other value, use JavaScript truthiness
  return !!trimmed && trimmed !== '0';
}
