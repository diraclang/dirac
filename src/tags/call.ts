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
  cleanSubroutinesToBoundary,
  pushParameters,
  popParameters,
  substituteVariables,
  setVariable,
  getVariable,
} from '../runtime/session.js';
import { integrateChildren, integrate } from '../runtime/interpreter.js';

/**
 * Convert a string value to the specified type
 */
function convertType(value: string, type: string, session?: DiracSession): any {
  if (value === '') {
    return value; // Keep empty strings as-is
  }
  
  switch (type) {
    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Cannot convert '${value}' to number`);
      }
      return num;
    case 'boolean':
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      throw new Error(`Cannot convert '${value}' to boolean`);
    case 'json':
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new Error(`Cannot parse '${value}' as JSON`);
      }
    case 'Object':
      // For Object type, look up the variable by name
      if (session && !value.startsWith('{')) {
        const varValue = getVariable(session, value);
        if (varValue !== undefined) {
          return varValue;
        }
      }
      // If it looks like JSON, parse it
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          return JSON.parse(value);
        } catch (e) {
          // Fall through to return as-is
        }
      }
      return value;
    case 'string':
    default:
      return value;
  }
}

export async function executeCall(session: DiracSession, element: DiracElement): Promise<void> {
  // Support both <call name="FOO" /> and direct <FOO /> syntax
  // For <call> tag, use name/subroutine attribute
  // For direct syntax, use element.tag
  let name: string;
  
  if (element.tag === 'call') {
    // Explicit <call> tag - use subroutine or name attribute
    // Prioritize 'subroutine' to avoid conflict with function parameters named 'name'
    name = element.attributes.subroutine || element.attributes.name || '';
  } else {
    // Direct tag syntax - use tag name itself, ignore name attribute
    name = element.tag;
  }
  
  if (session.debug) {
    console.error(`[CALL] Calling subroutine: ${name}`);
  }
  
  if (!name) {
    throw new Error('<call> requires name or subroutine attribute');
  }
  
  const subroutine = getSubroutine(session, name);
  if (!subroutine) {
    throw new Error(`Subroutine '${name}' not found`);
  }
  
  if (session.debug) {
    console.error(`[CALL] Found subroutine with attributes:`, Object.keys(subroutine.attributes));
  }
  
  // Handle extension (parent subroutine) using recursive descent
  const extendAttr = subroutine.attributes.extend;
  const extendsAttr = subroutine.attributes.extends;
  
  if (extendAttr !== undefined || extendsAttr !== undefined) {
    // This subroutine extends another - use recursive descent to build stack
    const cleanupBoundary = session.subroutines.length;
    const baseSubroutine = await registerExtendChain(session, subroutine, name);
    // Execute the ultimate base subroutine with extend flag set
    await executeCallInternal(session, baseSubroutine, element, true, cleanupBoundary);
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
  isExtendExecution: boolean = false,
  cleanupSubBoundary?: number
): Promise<void> {
  // Set boundary for local scope (variables AND subroutines)
  const oldBoundary = setBoundary(session);
  const oldSubBoundary = session.subBoundary;
  const currentSubBoundary = session.subroutines.length;
  session.subBoundary = currentSubBoundary;
  const wasReturn = session.isReturn;
  session.isReturn = false;
  
  // Track current subroutine name for available-subroutines
  const oldSubroutineName = session.currentSubroutineName;
  session.currentSubroutineName = callElement.tag;
  
  // Save childrenConsumed flag (nested calls will reset it)
  const oldChildrenConsumed = session.childrenConsumed;
  
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
  
  // Check if call site wants parameters to be visible
  const visibleAttr = callElement.attributes.visible;
  const parametersVisible = visibleAttr === 'true' || visibleAttr === 'variable' || visibleAttr === 'both';
  
  try {
    // 1. Set variables from <param-*> attributes if not already set in this boundary
    for (const [attrName, attrValue] of Object.entries(subroutine.attributes)) {
      if (attrName.startsWith('param-')) {
        const paramName = attrName.substring(6);
        
        // Skip 'name' parameter when element.tag is 'call' AND 'subroutine' attribute is NOT present
        // (because in that case 'name' is used to specify the function, not as a parameter)
        if (callElement.tag === 'call' && paramName === 'name' && !callElement.attributes.subroutine) {
          continue;
        }
        
        // Skip 'subroutine' parameter when element.tag is 'call' AND 'subroutine' attribute IS present
        // (because in that case 'subroutine' is used to specify the function, not as a parameter)
        if (callElement.tag === 'call' && paramName === 'subroutine' && callElement.attributes.subroutine) {
          continue;
        }
        
        // Check if variable exists in current boundary
        const alreadySet = session.variables.slice(session.varBoundary).some(v => v.name === paramName);
        if (!alreadySet) {
          // Priority: call attribute > param-* default > empty string
          let value: any = '';
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
          
          // Convert value to the specified type (only if not empty string)
          if (value !== '') {
            const parts = attrValue.split(':');
            const paramType = parts[0] || 'string';
            try {
              value = convertType(value, paramType, session);
            } catch (e) {
              throw new Error(`Parameter '${paramName}': ${e instanceof Error ? e.message : String(e)}`);
            }
          }
          
          setVariable(session, paramName, value, parametersVisible);
          
          // Track source variable for Object-type parameters (for writeback)
          const parts = attrValue.split(':');
          const paramType = parts[0] || 'string';
          const originalAttr = substitutedElement.attributes[paramName];
          if (paramType === 'Object' && originalAttr && !originalAttr.startsWith('{')) {
            // Store the source variable name for writeback
            const sourceVar = originalAttr.startsWith('$') ? originalAttr.substring(1) : originalAttr;
            session.variables[session.variables.length - 1].refName = sourceVar;
          }
        }
      }
    }

    // 2. Bind parameters from <parameters> if present
    const paramElements = callElement.children.filter(c => c.tag === 'parameters');
    if (paramElements.length > 0) {
      await bindParameters(session, subroutine, paramElements[0]);
    }

    // 3. Execute subroutine body
    // Reset flag to track if children are consumed by <parameters select="*"/>
    session.childrenConsumed = false;
    
    // Check if subroutine has lang=js attribute - if so, treat text content as JavaScript
    const lang = subroutine.attributes.lang;
    let langJsExecuted = false;
    if (lang === 'js') {
      if (session.debug) {
        console.error(`[CALL] lang=js detected, subroutine.text=${subroutine.text}, children.length=${subroutine.children.length}`);
      }
      
      // Collect text content from element.text or from text nodes in children
      let textContent = subroutine.text || '';
      if (!textContent) {
        // Try to collect text from children (text nodes or elements with text property)
        for (const child of subroutine.children) {
          if (child.text) {
            textContent += child.text;
          }
        }
      }
      
      if (textContent.trim()) {
        if (session.debug) {
          console.error(`[CALL] Executing lang=js content: ${textContent.substring(0, 50)}...`);
        }
        // Execute text content as JavaScript (like <eval>)
        const { executeEval } = await import('./eval.js');
        const evalElement: DiracElement = {
          tag: 'eval',
          attributes: {},
          children: [],
          text: textContent
        };
        await executeEval(session, evalElement);
        langJsExecuted = true;
      }
    }
    
    // Execute children normally (unless lang=js was executed)
    if (!langJsExecuted) {
      await integrateChildren(session, subroutine);
    }
    
    // 4. Auto-execute children if they weren't consumed by <parameters select="*"/>
    if (!session.childrenConsumed && callElement.children.length > 0) {
      if (session.debug) {
        console.error(`[CALL] Auto-executing ${callElement.children.length} unconsumed children`);
      }
      for (const child of callElement.children) {
        await integrate(session, child);
      }
    }

  } finally {
    // Restore skip flag
    session.skipSubroutineRegistration = oldSkipFlag;
    
    // Pop parameter stack
    popParameters(session);

    // Determine visibility setting for cleanup
    let visibleValue = subroutine.attributes.visible || 'false';
    if (callElement.attributes.visible) {
      visibleValue = callElement.attributes.visible;
    }
    const keepVariables = visibleValue === 'variable' || visibleValue === 'both' || visibleValue === 'true';
    const keepNested = visibleValue === 'subroutine' || visibleValue === 'both' || visibleValue === 'true';
    
    // Clean up scope (keep visible variables and subroutines) BEFORE restoring boundary
    cleanToBoundary(session, keepVariables);
    const boundaryToClean = cleanupSubBoundary ?? currentSubBoundary;
    session.subBoundary = boundaryToClean;
    cleanSubroutinesToBoundary(session, subroutine, callElement);
    
    session.varBoundary = oldBoundary;
    // Only restore subBoundary if we're NOT keeping nested subroutines
    // (cleanSubroutinesToBoundary already updated it if keepNested is true)
    if (!keepNested) {
      session.subBoundary = oldSubBoundary;
    }
    session.isReturn = wasReturn;
    session.currentSubroutineName = oldSubroutineName;
    session.childrenConsumed = oldChildrenConsumed;
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
