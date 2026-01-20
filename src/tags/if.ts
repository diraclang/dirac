/**
 * <if> tag - conditional execution
 * Maps to mask_tag_if in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { substituteVariables, getVariable } from '../runtime/session.js';
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
  const substituted = substituteVariables(session, test);
  
  // Simple condition evaluation (can be enhanced later)
  // Supports: ==, !=, <, >, <=, >=
  
  const operators = ['==', '!=', '<=', '>=', '<', '>'];
  
  for (const op of operators) {
    const parts = substituted.split(op);
    if (parts.length === 2) {
      const left = parts[0].trim();
      const right = parts[1].trim();
      
      switch (op) {
        case '==':
          return left === right;
        case '!=':
          return left !== right;
        case '<':
          return parseFloat(left) < parseFloat(right);
        case '>':
          return parseFloat(left) > parseFloat(right);
        case '<=':
          return parseFloat(left) <= parseFloat(right);
        case '>=':
          return parseFloat(left) >= parseFloat(right);
      }
    }
  }
  
  // If no operator, treat as boolean (non-empty = true)
  return substituted.trim() !== '' && substituted.trim() !== '0' && substituted.trim() !== 'false';
}
