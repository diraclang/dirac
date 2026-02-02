/**
 * <if> tag - conditional execution
 * Maps to mask_tag_if in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { substituteVariables, getVariable, substituteAttribute } from '../runtime/session.js';
import { integrateChildren } from '../runtime/interpreter.js';

export async function executeIf(session: DiracSession, element: DiracElement): Promise<void> {
  const test = element.attributes.test;
  
  if (!test) {
    throw new Error('<if> requires test attribute');
  }
  
  const condition = evaluateCondition(session, test);
  
  if (condition) {
    await integrateChildren(session, element);
  }
}

function evaluateCondition(session: DiracSession, test: string): boolean {
  // Substitute variables first
  // Use attribute-style substitution for test condition
  const substituted = substituteAttribute(session, test);
  
  // Simple condition evaluation (can be enhanced later)
  // Supports: ==, !=, <, >, <=, >=
  
  const operators = ['==', '!=', '<=', '>=', '<', '>'];
  
  for (const op of operators) {
    const parts = substituted.split(op);
    if (parts.length === 2) {
      let left = parts[0], right = parts[1];
      left = left.trim();
      right = right.trim();
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
  
  // If no operator, treat as boolean (non-empty = true)
  return substituted.trim() !== '' && substituted.trim() !== '0' && substituted.trim() !== 'false';
}
