/**
 * Scope-aware semantic validation for Dirac subroutines
 * Validates parameter and variable references within subroutine scope
 */

import type { DiracSession, DiracElement } from '../types/index.js';

export interface ScopeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  undefinedParameters: string[];      // Parameters referenced but not declared
  undefinedVariables: string[];       // Variables referenced but not declared
  unusedParameters: string[];         // Parameters declared but never used
  unusedVariables: string[];          // Variables declared but never used
}

/**
 * Extract parameter names from subroutine definition
 * param-name="string" -> "name"
 */
function extractParameterNames(element: DiracElement): string[] {
  const params: string[] = [];
  for (const attr in element.attributes) {
    if (attr.startsWith('param-')) {
      const paramName = attr.slice(6); // Remove 'param-' prefix
      params.push(paramName);
    }
  }
  return params;
}

/**
 * Extract variable references from text content
 * Finds ${varname} patterns
 */
function extractVariableReferences(text: string): string[] {
  const pattern = /\$\{([a-zA-Z_][a-zA-Z0-9_-]*)\}/g;
  const matches = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

/**
 * Scope context for tracking variables during validation
 */
class ScopeContext {
  parameters: Set<string>;           // Declared parameters
  declaredVariables: Set<string>;    // Variables declared with <defvar>
  referencedVariables: Set<string>;  // Variables referenced with <variable> or ${}
  referencedParameters: Set<string>; // Parameters actually used
  
  constructor(parameters: string[]) {
    this.parameters = new Set(parameters);
    this.declaredVariables = new Set();
    this.referencedVariables = new Set();
    this.referencedParameters = new Set();
  }
  
  /**
   * Check if a name is available in current scope
   * Priority: parameters -> declared variables
   */
  isInScope(name: string): boolean {
    return this.parameters.has(name) || this.declaredVariables.has(name);
  }
  
  /**
   * Record a variable declaration
   */
  declareVariable(name: string) {
    this.declaredVariables.add(name);
  }
  
  /**
   * Record a variable/parameter reference
   */
  referenceVariable(name: string) {
    this.referencedVariables.add(name);
    if (this.parameters.has(name)) {
      this.referencedParameters.add(name);
    }
  }
}

/**
 * Recursively validate variable scope in a subroutine body
 */
function validateScope(
  element: DiracElement,
  scope: ScopeContext,
  errors: string[],
  warnings: string[]
) {
  // Check for variable declarations
  if (element.tag === 'defvar') {
    const varName = element.attributes.name;
    if (varName) {
      scope.declareVariable(varName);
    }
  }
  
  // Check for variable references
  if (element.tag === 'variable') {
    const varName = element.attributes.name;
    if (varName) {
      scope.referenceVariable(varName);
      if (!scope.isInScope(varName)) {
        warnings.push(
          `Variable reference '${varName}' not found in local scope (may be from parent scope)`
        );
      }
    }
  }
  
  // Check for parameter references in <parameters> tag
  if (element.tag === 'parameters') {
    const select = element.attributes.select;
    if (select && select.startsWith('@')) {
      const paramName = select.slice(1); // Remove '@' prefix
      scope.referenceVariable(paramName);
      if (!scope.isInScope(paramName)) {
        warnings.push(
          `Parameter reference '${paramName}' not found in subroutine parameters`
        );
      }
    }
  }
  
  // DO NOT check for ${variable} references in text content
  // Text content uses <variable name="x" /> syntax, not ${}
  // Text can also contain script code (eval, etc.) where $ has different meaning
  
  // Check for ${variable} references in attribute values ONLY
  for (const [attrName, attrValue] of Object.entries(element.attributes)) {
    if (typeof attrValue === 'string') {
      // Check for ${var} syntax
      const varRefs = extractVariableReferences(attrValue);
      for (const varRef of varRefs) {
        scope.referenceVariable(varRef);
        if (!scope.isInScope(varRef)) {
          warnings.push(
            `Variable substitution '\${${varRef}}' in attribute not found in local scope (may be from parent scope)`
          );
        }
      }
      
      // Also check for $var syntax (without braces) used in test conditions
      // Pattern: $varname where varname is letters, numbers, underscore, dash
      const dollarVarPattern = /\$([a-zA-Z_][a-zA-Z0-9_-]*)/g;
      let dollarMatch;
      while ((dollarMatch = dollarVarPattern.exec(attrValue)) !== null) {
        const varName = dollarMatch[1];
        scope.referenceVariable(varName);
        // Don't warn for test conditions - they might use parent scope vars
      }
    }
  }
  
  // Recursively validate children
  for (const child of element.children) {
    validateScope(child, scope, errors, warnings);
  }
}

/**
 * Validate variable and parameter scope within a subroutine
 */
export function validateSubroutineScope(
  subroutine: DiracElement
): ScopeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Extract parameter declarations
  const parameters = extractParameterNames(subroutine);
  
  // Create scope context
  const scope = new ScopeContext(parameters);
  
  // Validate all child elements
  for (const child of subroutine.children) {
    validateScope(child, scope, errors, warnings);
  }
  
  // Check for unused parameters
  const unusedParameters = parameters.filter(p => !scope.referencedParameters.has(p));
  if (unusedParameters.length > 0) {
    warnings.push(
      `Unused parameters: ${unusedParameters.join(', ')}`
    );
  }
  
  // Check for unused variables
  const unusedVariables = Array.from(scope.declaredVariables).filter(
    v => !scope.referencedVariables.has(v)
  );
  if (unusedVariables.length > 0) {
    warnings.push(
      `Unused variables: ${unusedVariables.join(', ')}`
    );
  }
  
  // Identify undefined references (those not in parameters or declared variables)
  const undefinedReferences = Array.from(scope.referencedVariables).filter(
    v => !scope.isInScope(v)
  );
  
  const undefinedParameters = undefinedReferences.filter(v => 
    !scope.declaredVariables.has(v)
  );
  const undefinedVariables = undefinedReferences.filter(v =>
    scope.declaredVariables.has(v)
  );
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    undefinedParameters,
    undefinedVariables,
    unusedParameters,
    unusedVariables,
  };
}

/**
 * Validate all subroutine definitions in an AST
 */
export function validateAllSubroutineScopes(
  ast: DiracElement
): Map<string, ScopeValidationResult> {
  const results = new Map<string, ScopeValidationResult>();
  
  function findSubroutines(element: DiracElement) {
    if (element.tag === 'subroutine') {
      const name = element.attributes.name || 'anonymous';
      const result = validateSubroutineScope(element);
      results.set(name, result);
    }
    
    // Recursively search children
    for (const child of element.children) {
      findSubroutines(child);
    }
  }
  
  findSubroutines(ast);
  return results;
}
