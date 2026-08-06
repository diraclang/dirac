/**
 * <eval> tag - evaluate JavaScript expression
 * Maps to mask_tag_eval in MASK (but for JS, not C)
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { setVariable, getVariable, substituteVariables } from '../runtime/session.js';

// AsyncFunction constructor
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

export async function executeEval(session: DiracSession, element: DiracElement): Promise<void> {
  const name = element.attributes.name;
  const exprAttr = element.attributes.expr;
  
  // Get expression as-is (do not replace ${var})
  let expr: string;
  if (exprAttr) {
    expr = exprAttr;
  } else if (element.text) {
    expr = element.text;
  } else {
    throw new Error('<eval> requires expr attribute or text content');
  }
  
  if (session.debug) {
    console.error(`[EVAL] Code after substitution:\n${expr}\n`);
  }
  
  try {
    // Build context object with all variables
    const context: Record<string, any> = {};
    for (const v of session.variables) {
      let value = v.value;
      
      // Auto-parse JSON strings to objects/arrays
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Not valid JSON, keep as string
          }
        }
      }
      
      context[v.name] = value;
    }
    
    if (session.debug) {
      console.error('[EVAL] Context variables:', Object.keys(context).filter(k => !['fs', 'path', '__dirname', 'getParams', 'getVariable', 'setVariable', 'session'].includes(k)));
    }
    
    // Add Node.js modules to context
    const { default: fs } = await import('fs');
    const { default: path } = await import('path');
    const { fileURLToPath } = await import('url');
    context.fs = fs;
    context.path = path;
    context.__dirname = process.cwd();  // ESM doesn't have __dirname, use cwd
    
    // Add helper to get current parameters from stack
    context.getParams = () => {
      const params = session.parameterStack[session.parameterStack.length - 1];
      return params && params[0] ? params[0] : null;
    };
    
    // Add session runtime functions
    context.getVariable = (name: string) => getVariable(session, name);
    context.setVariable = (name: string, value: any, global: boolean = false) => 
      setVariable(session, name, value, global);
    
    // Add session object for orchestration (reserved identifier in eval context)
    context.session = session;
    
    let result: any;
    // Execute as async function to support top-level await
    const func = new AsyncFunction(...Object.keys(context), expr);
    result = await func(...Object.values(context));
    
    if (session.debug) {
      console.error(`[EVAL] Result: ${JSON.stringify(result)}`);
    }
    
    // Store result if name provided
    if (name) {
      setVariable(session, name, result, false);
    }
    
    // Write back modified objects to session variables
    // This allows mutations like self.x = 10 to persist
    for (const [varName, varValue] of Object.entries(context)) {
      // Skip special context variables
      if (['fs', 'path', '__dirname', 'getParams', 'getVariable', 'setVariable', 'session'].includes(varName)) {
        continue;
      }
      
      // Check if the value was modified (objects are mutable)
      const sessionVar = session.variables.find(v => v.name === varName);
      if (sessionVar && typeof varValue === 'object' && varValue !== null) {
        sessionVar.value = varValue;
        
        // If this was passed from another variable (Object-type parameter), write back to source
        if (sessionVar.refName) {
          const sourceVar = session.variables.find(v => v.name === sessionVar.refName);
          if (sourceVar) {
            sourceVar.value = varValue;
          }
        }
      }
    }

    
  } catch (error) {
    throw new Error(`Eval error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
