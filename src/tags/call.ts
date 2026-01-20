/**
 * <call> tag - invoke subroutine
 * Maps to mask_call_integrate in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { 
  getSubroutine, 
  setBoundary, 
  popToBoundary,
  cleanToBoundary,
  pushParameters,
  popParameters,
  substituteVariables,
  setVariable,
  getVariable,
} from '../runtime/session.js';
import { integrateChildren } from '../runtime/interpreter.js';

export async function executeCall(session: DiracSession, element: DiracElement): Promise<void> {
  const name = element.attributes.name || element.attributes.subroutine;
  
  if (!name) {
    throw new Error('<call> requires name or subroutine attribute');
  }
  
  const subroutine = getSubroutine(session, name);
  if (!subroutine) {
    throw new Error(`Subroutine '${name}' not found`);
  }
  
  // Handle extension (parent subroutine)
  const extendsName = subroutine.attributes.extends;
  if (extendsName) {
    const parent = getSubroutine(session, extendsName);
    if (parent) {
      // Call parent first
      await executeCallInternal(session, parent, element);
    }
  }
  
  // Call this subroutine
  await executeCallInternal(session, subroutine, element);
}

async function executeCallInternal(
  session: DiracSession, 
  subroutine: DiracElement,
  callElement: DiracElement
): Promise<void> {
  // Set boundary for local scope
  const oldBoundary = setBoundary(session);
  const wasReturn = session.isReturn;
  session.isReturn = false;
  
  try {
    // Bind parameters
    const paramElements = callElement.children.filter(c => c.tag === 'parameters');
    if (paramElements.length > 0) {
      await bindParameters(session, subroutine, paramElements[0]);
    }
    
    // Execute subroutine body
    await integrateChildren(session, subroutine);
    
  } finally {
    // Clean up scope (keep visible variables)
    session.varBoundary = oldBoundary;
    cleanToBoundary(session);
    session.isReturn = wasReturn;
  }
}

async function bindParameters(
  session: DiracSession,
  subroutine: DiracElement, 
  callParams: DiracElement
): Promise<void> {
  // Find <parameters> definition in subroutine
  const paramDef = subroutine.children.find(c => c.tag === 'parameters');
  if (!paramDef) {
    return; // No parameters defined
  }
  
  // Get variable definitions from parameter declaration
  const paramVars = paramDef.children.filter(c => c.tag === 'variable');
  const callVars = callParams.children.filter(c => c.tag === 'variable');
  
  // Bind each parameter
  for (let i = 0; i < paramVars.length; i++) {
    const paramVar = paramVars[i];
    const callVar = callVars[i];
    
    const paramName = paramVar.attributes.name;
    const passby = paramVar.attributes.passby || 'value';
    
    if (!paramName) continue;
    
    let value: any;
    
    if (callVar) {
      // Get value from call site
      const callValue = callVar.attributes.value;
      if (callValue) {
        if (passby === 'ref') {
          // Pass by reference - store variable name
          setVariable(session, paramName, getVariable(session, callValue), false);
          session.variables[session.variables.length - 1].passby = 'ref';
          session.variables[session.variables.length - 1].refName = callValue;
        } else {
          // Pass by value
          value = substituteVariables(session, callValue);
          setVariable(session, paramName, value, false);
        }
      }
    } else {
      // No value provided - use default if available
      const defaultValue = paramVar.attributes.default || '';
      value = substituteVariables(session, defaultValue);
      setVariable(session, paramName, value, false);
    }
  }
}
