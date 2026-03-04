// Utility: Substitute both $var and ${var} in a string using session variables
import { substituteAttribute } from '../runtime/session.js';

/**
 * <call> tag - invoke subroutine
 * Maps to mask_call_integrate in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { 
  getSubroutine, 
  getParentSubroutine,
  setBoundary, 
  popToBoundary,
  cleanToBoundary,
  setSubroutineBoundary,
  cleanSubroutinesToBoundary,
  pushParameters,
  popParameters,
  substituteVariables,
  setVariable,
  getVariable,
} from '../runtime/session.js';
import { integrateChildren } from '../runtime/interpreter.js';

export async function executeCall(session: DiracSession, element: DiracElement): Promise<void> {
  // Support both <call name="FOO" /> and direct <FOO /> syntax
  // For <call> tag, use name/subroutine attribute
  // For direct syntax, use element.tag
  let name: string;
  
  if (element.tag === 'call') {
    // Explicit <call> tag - use name or subroutine attribute
    name = element.attributes.name || element.attributes.subroutine || '';
  } else {
    // Direct tag syntax - use tag name itself, ignore name attribute
    name = element.tag;
  }
  
  if (!name) {
    throw new Error('<call> requires name or subroutine attribute');
  }
  
  const subroutine = getSubroutine(session, name);
  if (!subroutine) {
    throw new Error(`Subroutine '${name}' not found`);
  }
  
  // Handle extension (parent subroutine) using recursive descent
  const extendAttr = subroutine.attributes.extend;
  const extendsAttr = subroutine.attributes.extends;
  
  if (extendAttr !== undefined || extendsAttr !== undefined) {
    // This subroutine extends another - use recursive descent to build stack
    const baseSubroutine = await registerExtendChain(session, subroutine, name);
    // Execute the ultimate base subroutine with extend flag set
    await executeCallInternal(session, baseSubroutine, element, true);
  } else {
    // No extension - normal subroutine call
    await executeCallInternal(session, subroutine, element, false);
  }
}

/**
 * Recursive descent for extend mechanism:
 * 1. Recursively descend to ultimate parent (no extend)
 * 2. Register base's nested subroutines
 * 3. As recursion unwinds, register each level's subroutines (latest on top of stack)
 * 4. Return the ultimate base to be executed
 */
async function registerExtendChain(
  session: DiracSession,
  subroutine: DiracElement,
  currentName: string
): Promise<DiracElement> {
  const { executeSubroutine } = await import('./subroutine.js');
  
  // Determine parent name
  const extendsAttr = subroutine.attributes.extends;
  let parentName: string;
  
  if (extendsAttr) {
    // extends="parentName" - use explicit parent name
    parentName = extendsAttr;
  } else {
    // extend (no value) - use same name, search for earlier definition
    parentName = currentName;
  }
  
  // Get parent, passing current subroutine if using same name
  const parent = getParentSubroutine(session, parentName, parentName === currentName ? subroutine : undefined);
  
  if (!parent) {
    // No parent found - shouldn't happen, but handle gracefully
    return subroutine;
  }
  
  // Check if parent also extends
  const parentExtendAttr = parent.attributes.extend;
  const parentExtendsAttr = parent.attributes.extends;
  
  let baseSubroutine: DiracElement;
  
  if (parentExtendAttr !== undefined || parentExtendsAttr !== undefined) {
    // Parent extends - recursively process parent first
    baseSubroutine = await registerExtendChain(session, parent, parentName);
  } else {
    // Parent doesn't extend - this is the ultimate base
    // Register base's nested subroutines (bottom of stack)
    for (const child of parent.children) {
      if (child.tag === 'subroutine') {
        executeSubroutine(session, child);
      }
    }
    baseSubroutine = parent;
  }
  
  // After parent chain is processed, register current level's nested subroutines
  // These go on top and override parent's definitions
  for (const child of subroutine.children) {
    if (child.tag === 'subroutine') {
      executeSubroutine(session, child);
    }
  }
  
  return baseSubroutine;
}

async function executeCallInternal(
  session: DiracSession, 
  subroutine: DiracElement,
  callElement: DiracElement,
  isExtendExecution: boolean = false
): Promise<void> {
  // Set boundary for local scope (variables AND subroutines)
  const oldBoundary = setBoundary(session);
  const oldSubBoundary = setSubroutineBoundary(session);
  const wasReturn = session.isReturn;
  session.isReturn = false;
  
  // Track current subroutine name for available-subroutines
  const oldSubroutineName = session.currentSubroutineName;
  session.currentSubroutineName = callElement.tag;
  
  // For extend execution, skip subroutine registration during body execution
  const oldSkipFlag = session.skipSubroutineRegistration;
  if (isExtendExecution) {
    session.skipSubroutineRegistration = true;
  }
  
  // Substitute variables in call element attributes before pushing to parameter stack
  const substitutedElement: DiracElement = {
    tag: callElement.tag,
    attributes: {},
    children: callElement.children
  };
  
// Utility: Substitute both $var and ${var} in a string using session variables
  for (const [key, value] of Object.entries(callElement.attributes)) {
    substitutedElement.attributes[key] = substituteAttribute(session, value);
  }
  
  // Resolve positional arguments to actual parameter names
  resolvePositionalArguments(substitutedElement, subroutine);
  
  // Push caller element onto parameter stack for <parameters select="*|@*|@attr"/> access
  pushParameters(session, [substitutedElement]);
  
  try {
    // 1. Set variables from <param-*> attributes if not already set in this boundary
    for (const [attrName, attrValue] of Object.entries(subroutine.attributes)) {
      if (attrName.startsWith('param-')) {
        const paramName = attrName.substring(6);
        // Check if variable exists in current boundary
        const alreadySet = session.variables.slice(session.varBoundary).some(v => v.name === paramName);
        if (!alreadySet) {
          // Priority: call attribute > param-* default > empty string
          let value = '';
          // Use substitutedElement (which has resolved positional args) instead of callElement
          if (substitutedElement.attributes && substitutedElement.attributes[paramName] !== undefined) {
            value = substitutedElement.attributes[paramName]; // Already substituted above
          } else {
            // Always treat last colon-separated part as default value (if >3 fields)
            const parts = attrValue.split(':');
            if (parts.length > 3) {
              value = parts[parts.length - 1];
            }
          }
          setVariable(session, paramName, value, false);
        }
      }
    }

    // 2. Bind parameters from <parameters> if present
    const paramElements = callElement.children.filter(c => c.tag === 'parameters');
    if (paramElements.length > 0) {
      await bindParameters(session, subroutine, paramElements[0]);
    }

    // 3. Execute subroutine body
    await integrateChildren(session, subroutine);

  } finally {
    // Restore skip flag
    session.skipSubroutineRegistration = oldSkipFlag;
    
    // Pop parameter stack
    popParameters(session);

    // Clean up scope (keep visible variables and subroutines) BEFORE restoring boundary
    cleanToBoundary(session);
    cleanSubroutinesToBoundary(session, subroutine);
    
    session.varBoundary = oldBoundary;
    session.subBoundary = oldSubBoundary;
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

/**
 * Resolve positional arguments (_positional-N) to actual parameter names
 * by looking at the subroutine's param-* attributes in order
 * 
 * Example:
 *   |greeting zhi>  generates: _positional-0="zhi"
 *   <greeting param-name=String> defines: param-name
 *   Result: name="zhi"
 */
function resolvePositionalArguments(
  callElement: DiracElement,
  subroutine: DiracElement
): void {
  // Check if call has any positional arguments
  const positionalAttrs = Object.keys(callElement.attributes)
    .filter(key => key.startsWith('_positional-'))
    .sort(); // Sort to ensure correct order: _positional-0, _positional-1, etc.
  
  if (positionalAttrs.length === 0) {
    return; // No positional arguments
  }
  
  // Extract parameter names from subroutine in definition order
  const paramNames: string[] = [];
  for (const [attrName] of Object.entries(subroutine.attributes)) {
    if (attrName.startsWith('param-')) {
      paramNames.push(attrName.substring(6)); // Remove 'param-' prefix
    }
  }
  
  // Map positional arguments to parameter names
  for (let i = 0; i < positionalAttrs.length; i++) {
    const positionalKey = positionalAttrs[i];
    const value = callElement.attributes[positionalKey];
    
    if (i < paramNames.length) {
      // Map to actual parameter name
      callElement.attributes[paramNames[i]] = value;
    } else {
      // More positional args than parameters - could warn or error
      // For now, silently ignore extra positional arguments
    }
    
    // Remove the _positional-N marker
    delete callElement.attributes[positionalKey];
  }
}
