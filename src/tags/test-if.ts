/**
 * <test-if> tag - conditional execution with test attribute
 * This is the attribute-based conditional (original Dirac style)
 * 
 * Usage: <test-if test="$var == value">...</test-if>
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { substituteAttribute } from '../runtime/session.js';
import { integrateChildren } from '../runtime/interpreter.js';

export async function executeTestIf(session: DiracSession, element: DiracElement): Promise<void> {
  const test = element.attributes.test;
  
  if (!test) {
    throw new Error('<test-if> requires test attribute');
  }
  
  // Get variable value
  const value = substituteAttribute(session, test);
  
  // Check comparison attributes
  const eq = element.attributes.eq;
  const ne = element.attributes.ne;
  const lt = element.attributes.lt;
  const gt = element.attributes.gt;
  const le = element.attributes.le;
  const ge = element.attributes.ge;
  
  let condition = false;
  
  if (eq !== undefined) {
    const compareValue = substituteAttribute(session, eq);
    condition = value === compareValue;
  } else if (ne !== undefined) {
    const compareValue = substituteAttribute(session, ne);
    condition = value !== compareValue;
  } else if (lt !== undefined) {
    const compareValue = substituteAttribute(session, lt);
    const valueNum = parseFloat(value);
    const compareNum = parseFloat(compareValue);
    condition = !isNaN(valueNum) && !isNaN(compareNum) && valueNum < compareNum;
  } else if (gt !== undefined) {
    const compareValue = substituteAttribute(session, gt);
    const valueNum = parseFloat(value);
    const compareNum = parseFloat(compareValue);
    condition = !isNaN(valueNum) && !isNaN(compareNum) && valueNum > compareNum;
  } else if (le !== undefined) {
    const compareValue = substituteAttribute(session, le);
    const valueNum = parseFloat(value);
    const compareNum = parseFloat(compareValue);
    condition = !isNaN(valueNum) && !isNaN(compareNum) && valueNum <= compareNum;
  } else if (ge !== undefined) {
    const compareValue = substituteAttribute(session, ge);
    const valueNum = parseFloat(value);
    const compareNum = parseFloat(compareValue);
    condition = !isNaN(valueNum) && !isNaN(compareNum) && valueNum >= compareNum;
  } else {
    // No comparison attribute, evaluate test value as boolean
    condition = evaluateCondition(session, test);
  }
  
  if (condition) {
    await integrateChildren(session, element);
  }
}

function evaluateCondition(session: DiracSession, test: string): boolean {
  // Substitute variables first
  // Use attribute-style substitution for test condition
  const substituted = substituteAttribute(session, test);
  
  // Simple condition evaluation
  // Supports: ==, !=, <, >, <=, >=
  
  const operators = ['==', '!=', '<=', '>=', '<', '>'];
  
  for (const op of operators) {
    const parts = substituted.split(op);
    if (parts.length === 2) {
      let left = parts[0].trim();
      let right = parts[1].trim();
      const leftNum = parseFloat(left);
      const rightNum = parseFloat(right);
      const bothNumbers = !isNaN(leftNum) && !isNaN(rightNum);
      
      switch (op) {
        case '==':
          return bothNumbers ? leftNum === rightNum : left === right;
        case '!=':
          return bothNumbers ? leftNum !== rightNum : left !== right;
        case '<':
          return leftNum < rightNum;
        case '>':
          return leftNum > rightNum;
        case '<=':
          return leftNum <= rightNum;
        case '>=':
          return leftNum >= rightNum;
      }
    }
  }
  
  // If no operator found, treat as boolean
  // Empty, "0", or "false" is false
  // Everything else is true
  if (substituted === '' || substituted === '0' || substituted === 'false') {
    return false;
  }
  
  return true;
}
