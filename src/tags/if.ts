/**
 * <if> tag - conditional execution with <cond>, <then>, <else> children
 * Maps to mask_if_integrate in MASK C implementation
 * 
 * Usage:
 * <if>
 *   <cond>condition expression or <cond> tag</cond>
 *   <then>executed if true</then>
 *   <else>executed if false</else>
 * </if>
 * 
 * The first child can be:
 * - A <cond> tag with condition logic
 * - Any other element that evaluates to a value
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { getOutput } from '../runtime/session.js';

export async function executeIf(session: DiracSession, element: DiracElement): Promise<void> {
  // Extract condition, then, and else elements from children
  let conditionElement: DiracElement | null = null;
  let thenElement: DiracElement | null = null;
  let elseElement: DiracElement | null = null;
  
  for (const child of element.children) {
    const tag = child.tag.toLowerCase();
    if (tag === 'cond') {
      conditionElement = child;
    } else if (tag === 'then' || tag === 'do') {
      thenElement = child;
    } else if (tag === 'else') {
      elseElement = child;
    } else if (!conditionElement && child.tag) {
      // First non-cond/then/else element is treated as condition
      conditionElement = child;
    }
  }
  
  // Evaluate the condition
  const condition = await evaluatePredicate(session, conditionElement);
  
  // Execute then or else block based on condition
  if (condition) {
    if (thenElement) {
      const { integrateChildren } = await import('../runtime/interpreter.js');
      await integrateChildren(session, thenElement);
    }
  } else {
    if (elseElement) {
      const { integrateChildren } = await import('../runtime/interpreter.js');
      await integrateChildren(session, elseElement);
    }
  }
}

/**
 * Evaluate a predicate element to determine if it's true or false
 * Maps to mask_predicate_integrate in MASK
 */
async function evaluatePredicate(session: DiracSession, predicateElement: DiracElement | null): Promise<boolean> {
  if (!predicateElement) {
    return false;
  }
  
  // If it's a <cond> tag, process it with condition evaluation
  if (predicateElement.tag.toLowerCase() === 'cond') {
    return await evaluateCondition(session, predicateElement);
  }
  
  // Otherwise, execute the element and evaluate its output
  const outputLengthBefore = session.output.length;
  const { integrate } = await import('../runtime/interpreter.js');
  await integrate(session, predicateElement);
  
  // Get the new output chunks added during evaluation
  const newOutputChunks = session.output.slice(outputLengthBefore);
  const result = newOutputChunks.join('').trim();
  
  // Restore output to state before evaluation (remove intermediate output)
  session.output.length = outputLengthBefore;
  
  // Evaluate the result as a boolean
  if (result === '') {
    return false;
  }
  if (result === '0' || result === 'false') {
    return false;
  }
  if (result === '1' || result === 'true') {
    return true;
  }
  // Non-empty string is truthy
  return result.length > 0;
}

/**
 * Evaluate a <cond> element with eval attribute and arguments
 * Maps to mask_condition_integrate in MASK
 */
async function evaluateCondition(session: DiracSession, condElement: DiracElement): Promise<boolean> {
  const evalType = condElement.attributes?.eval;
  
  if (!evalType) {
    // No eval attribute, just evaluate children as predicate
    return await evaluatePredicate(session, condElement);
  }
  
  // Capture the current output level before evaluating args
  const outputLengthBefore = session.output.length;
  
  // Get arguments from children
  const args: string[] = [];
  const { integrate } = await import('../runtime/interpreter.js');
  
  for (const child of condElement.children) {
    if (child.tag.toLowerCase() === 'arg') {
      const argOutputStart = session.output.length;
      const { integrateChildren } = await import('../runtime/interpreter.js');
      await integrateChildren(session, child);
      const newChunks = session.output.slice(argOutputStart);
      const argValue = newChunks.join('');
      args.push(argValue);
    }
  }
  
  // Restore output to state before evaluation (remove arg outputs)
  session.output.length = outputLengthBefore;
  
  // Evaluate based on eval type
  return evaluateConditionType(evalType, args);
}

/**
 * Evaluate condition based on type and arguments
 */
function evaluateConditionType(evalType: string, args: string[]): boolean {
  const type = evalType.toLowerCase();
  
  switch (type) {
    case 'eq':
    case 'equal':
    case 'same':
      return args.length >= 2 && args[0] === args[1];
    
    case 'ne':
    case 'notequal':
    case 'different':
      return args.length >= 2 && args[0] !== args[1];
    
    case 'lt':
    case 'less':
      if (args.length >= 2) {
        const a = parseFloat(args[0]);
        const b = parseFloat(args[1]);
        return !isNaN(a) && !isNaN(b) && a < b;
      }
      return false;
    
    case 'le':
    case 'lessequal':
      if (args.length >= 2) {
        const a = parseFloat(args[0]);
        const b = parseFloat(args[1]);
        return !isNaN(a) && !isNaN(b) && a <= b;
      }
      return false;
    
    case 'gt':
    case 'greater':
      if (args.length >= 2) {
        const a = parseFloat(args[0]);
        const b = parseFloat(args[1]);
        return !isNaN(a) && !isNaN(b) && a > b;
      }
      return false;
    
    case 'ge':
    case 'greaterequal':
      if (args.length >= 2) {
        const a = parseFloat(args[0]);
        const b = parseFloat(args[1]);
        return !isNaN(a) && !isNaN(b) && a >= b;
      }
      return false;
    
    default:
      // Unknown eval type, return false
      return false;
  }
}
