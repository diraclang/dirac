/**
 * <execute> tag - Execute dynamically generated Dirac code
 * Takes LLM-generated or variable content and interprets it as Dirac XML
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { getVariable, substituteVariables } from '../runtime/session.js';
import { DiracParser } from '../runtime/parser.js';
import { integrate } from '../runtime/interpreter.js';

export async function executeExecute(session: DiracSession, element: DiracElement): Promise<void> {
  const sourceAttr = element.attributes.source;
  
  // Get the Dirac code to execute
  let diracCode: string;
  
  if (sourceAttr) {
    // Get from variable
    diracCode = getVariable(session, sourceAttr);
    if (!diracCode) {
      throw new Error(`<execute> source variable '${sourceAttr}' not found`);
    }
  } else if (element.text) {
    // Get from text content (with variable substitution)
    diracCode = substituteVariables(session, element.text);
  } else {
    throw new Error('<execute> requires source attribute or text content');
  }
  
  if (session.debug) {
    console.error(`[EXECUTE] Interpreting dynamic code:\n${diracCode}\n`);
  }
  
  // Strip markdown code blocks if present
  diracCode = diracCode.trim();
  if (diracCode.startsWith('```')) {
    // Remove markdown code fences
    diracCode = diracCode.replace(/^```(?:xml|html)?\n?/m, '').replace(/\n?```$/m, '').trim();
  }
  
  try {
    // Parse the dynamic Dirac code
    const parser = new DiracParser();
    const dynamicAST = parser.parse(diracCode);
    
    // Execute the dynamically generated code
    await integrate(session, dynamicAST);
    
  } catch (error) {
    throw new Error(`Execute error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
