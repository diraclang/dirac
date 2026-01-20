/**
 * <expr> tag - arithmetic and logical operations
 * Maps to mask_tag_expr in MASK
 * 
 * Supports: plus, minus, times, divide, mod, lt, gt, eq, and, or, not
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit, substituteVariables } from '../runtime/session.js';
import { integrate } from '../runtime/interpreter.js';

export async function executeExpr(session: DiracSession, element: DiracElement): Promise<void> {
  const op = element.attributes.eval || element.attributes.op;
  
  if (!op) {
    throw new Error('<expr> requires eval or op attribute');
  }
  
  // Collect arguments from <arg> children
  const args: number[] = [];
  const stringArgs: string[] = [];
  
  for (const child of element.children) {
    if (child.tag === 'arg') {
      let argValue = '';
      
      // Check if arg has text content directly
      if (child.text) {
        argValue = substituteVariables(session, child.text);
      } else {
        // Capture output from arg children
        const oldOutput = session.output;
        session.output = [];
        
        for (const argChild of child.children) {
          await integrate(session, argChild);
        }
        
        argValue = session.output.join('');
        session.output = oldOutput;
      }
      
      stringArgs.push(argValue);
      const numValue = parseFloat(argValue);
      args.push(isNaN(numValue) ? 0 : numValue);
    }
  }
  
  let result: number | boolean = 0;
  
  switch (op.toLowerCase()) {
    case 'plus':
    case 'add':
      result = args.reduce((a, b) => a + b, 0);
      break;
      
    case 'minus':
    case 'subtract':
      result = args.length > 0 ? args[0] - args.slice(1).reduce((a, b) => a + b, 0) : 0;
      break;
      
    case 'times':
    case 'multiply':
    case 'mul':
      result = args.reduce((a, b) => a * b, 1);
      break;
      
    case 'divide':
    case 'div':
      if (args.length >= 2 && args[1] !== 0) {
        result = args[0] / args[1];
      } else {
        result = 0;
      }
      break;
      
    case 'mod':
    case 'modulo':
      if (args.length >= 2 && args[1] !== 0) {
        result = args[0] % args[1];
      } else {
        result = 0;
      }
      break;
      
    case 'lt':
    case 'less':
      result = args.length >= 2 ? args[0] < args[1] : false;
      break;
      
    case 'gt':
    case 'greater':
      result = args.length >= 2 ? args[0] > args[1] : false;
      break;
      
    case 'eq':
    case 'equal':
      result = args.length >= 2 ? args[0] === args[1] : false;
      break;
      
    case 'and':
      result = args.every(a => a !== 0);
      break;
      
    case 'or':
      result = args.some(a => a !== 0);
      break;
      
    case 'not':
      result = args.length > 0 ? args[0] === 0 : true;
      break;
      
    case 'same':
    case 'strcmp':
      result = stringArgs.length >= 2 ? stringArgs[0] === stringArgs[1] : false;
      break;
      
    default:
      throw new Error(`<expr> unknown operation: ${op}`);
  }
  
  // Emit result
  if (typeof result === 'boolean') {
    emit(session, result ? '1' : '0');
  } else {
    emit(session, String(result));
  }
}
