/**
 * Tag validation utilities
 * Provides reusable validation logic for tag-check and LLM execution
 */

import type { DiracSession, DiracElement, Subroutine } from '../types/index.js';
import fs from 'fs';
import yaml from 'js-yaml';

// Configurable similarity cutoff
const SIMILARITY_CUTOFF = 0.75;

export interface ValidationResult {
  valid: boolean;
  tagName: string;
  originalTag: string;
  corrected: boolean;
  errors: string[];
  warnings: string[];
  similarity?: number;
  attributeCorrections?: { [oldAttr: string]: string }; // Map of old attr name -> new attr name
  typeErrors?: string[]; // Type validation errors
  nestedValidation?: ValidationResult[]; // Validation results for nested tags
  scopeValidation?: import('./scope-validator.js').ScopeValidationResult; // Scope validation for subroutines
}

// Helper: get embedding server config from config.yml
function getEmbeddingServerConfig() {
  try {
    const configPath = process.env.DIRAC_CONFIG || 'config.yml';
    const config = yaml.load(fs.readFileSync(configPath, 'utf8')) as any;
    const host = config.embeddingServer?.host || 'localhost';
    const port = config.embeddingServer?.port || 11434;
    const model = config.embeddingServer?.model || 'embeddinggemma';
    return { host, port, model };
  } catch (e) {
    // Fallback to defaults if config file not found
    return { host: 'localhost', port: 11434, model: 'embeddinggemma' };
  }
}

// Helper: call Ollama embedding API directly
async function getEmbeddings(tags: string[]): Promise<number[][]> {
  const { host, port, model } = getEmbeddingServerConfig();
  return await Promise.all(tags.map(async tag => {
    const response = await fetch(`http://${host}:${port}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: tag })
    });
    const data: any = await response.json();
    return data.embedding;
  }));
}

function cosine(a: number[], b: number[]): number {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return dot / (normA * normB);
}

async function getBestTagMatch(candidate: string, allowed: string[]): Promise<{tag: string, score: number}> {
  const tags = [candidate, ...allowed];
  const embeddings = await getEmbeddings(tags);
  const candidateVec = embeddings[0];
  const allowedVecs = embeddings.slice(1);
  let bestIdx = 0, bestScore = -1;
  allowedVecs.forEach((vec, i) => {
    const score = cosine(candidateVec, vec);
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  });
  return { tag: allowed[bestIdx], score: bestScore };
}

/**
 * Validate parameter type against expected type
 */
function validateParameterType(
  paramName: string,
  value: string,
  expectedType?: string
): { valid: boolean; error?: string } {
  if (!expectedType) {
    return { valid: true }; // No type specified, accept anything
  }
  
  const type = expectedType.split(':')[0].toLowerCase(); // Extract type from "string:required:desc"
  
  switch (type) {
    case 'boolean':
      if (value !== 'true' && value !== 'false' && value !== '') {
        return {
          valid: false,
          error: `Parameter '${paramName}' expects boolean (true/false), got: ${value}`
        };
      }
      break;
    case 'number':
    case 'integer':
      if (value !== '' && isNaN(Number(value))) {
        return {
          valid: false,
          error: `Parameter '${paramName}' expects number, got: ${value}`
        };
      }
      break;
    case 'string':
      // Strings always valid
      break;
    default:
      // Unknown type, accept it
      break;
  }
  
  return { valid: true };
}

/**
 * Check if attribute value contains invalid XML tags (common LLM mistake)
 */
function validateAttributeValue(
  attrName: string,
  value: string
): { valid: boolean; error?: string; warning?: string } {
  // Check for <variable> tags in attribute values (should use ${} instead)
  if (value.includes('<variable')) {
    return {
      valid: false,
      error: `Attribute '${attrName}' contains <variable> tag - use \${varname} syntax in attributes instead`,
    };
  }
  
  // Check for other XML-like tags in attribute values
  if (/<[a-zA-Z]/.test(value) && !value.includes('${')) {
    return {
      valid: false,
      warning: `Attribute '${attrName}' appears to contain XML tags - attribute values should use \${} syntax for variables`,
    };
  }
  
  return { valid: true };
}

/**
 * Deep validation: validate all nested tags within an element
 */
async function validateNestedTags(
  session: DiracSession,
  element: DiracElement,
  options: {
    autocorrect?: boolean;
    similarityCutoff?: number;
  } = {}
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  for (const child of element.children) {
    if (child.tag && child.tag.trim() !== '') {
      const result = await validateTag(session, child, options);
      results.push(result);
      
      // Recursively validate children
      if (child.children && child.children.length > 0) {
        const nestedResults = await validateNestedTags(session, child, options);
        results.push(...nestedResults);
      }
    }
  }
  
  return results;
}

/**
 * Validate a single tag element against available subroutines
 */
export async function validateTag(
  session: DiracSession,
  element: DiracElement,
  options: {
    autocorrect?: boolean;
    similarityCutoff?: number;
    deepValidation?: boolean; // Enable deep validation of nested tags
  } = {}
): Promise<ValidationResult> {
  const { autocorrect = false, similarityCutoff = SIMILARITY_CUTOFF, deepValidation = false } = options;
  
  // Log validation only in debug mode
  if (session.debug) {
    console.error(`[VALIDATE] Tag: <${element.tag}>, autocorrect: ${autocorrect}, attributes:`, Object.keys(element.attributes));
  }
  
  // Get allowed subroutine names
  const { getAvailableSubroutines } = await import('../runtime/session.js');
  const subroutines = getAvailableSubroutines(session);
  const allowed = new Set(subroutines.map(s => s.name));
  
  const tagName = element.tag;
  const result: ValidationResult = {
    valid: false,
    tagName,
    originalTag: tagName,
    corrected: false,
    errors: [],
    warnings: [],
    attributeCorrections: {},
    typeErrors: [],
    nestedValidation: [],
    scopeValidation: undefined,
  };
  
  // Check if tag exists
  if (allowed.has(tagName)) {
    if (session.debug) {
      console.error(`[VALIDATE] Tag <${tagName}> is valid`);
    }
    // Tag name is valid, now check required and unknown parameters
    const sub = subroutines.find(s => s.name === tagName);
    if (sub && Array.isArray(sub.parameters)) {
      const paramNames = sub.parameters.map(p => p.name);
      
      if (session.debug) {
        console.error(`[VALIDATE] Tag <${tagName}> has ${paramNames.length} parameters:`, paramNames);
      }
      
      // Check for missing required parameters
      for (const param of sub.parameters) {
        if (param.required && !(param.name in element.attributes)) {
          result.errors.push(`Missing required parameter: ${param.name}`);
        }
      }
      
      // Check for unknown attributes and auto-correct if enabled
      for (const attr in element.attributes) {
        // Skip validation for param-* and meta-* on <subroutine> tag (these are wildcard patterns)
        if (tagName === 'subroutine' && (attr.startsWith('param-') || attr.startsWith('meta-'))) {
          if (session.debug) {
            console.error(`[VALIDATE] Skipping validation for wildcard attribute '${attr}' on <subroutine>`);
          }
          continue;
        }
        
        if (!paramNames.includes(attr)) {
          if (session.debug) {
            console.error(`[VALIDATE] Unknown attribute '${attr}' on <${tagName}>`);
          }
          if (autocorrect && paramNames.length > 0) {
            let correctedAttr: string | null = null;
            let similarityScore = 0;
            
            // Special case: if there's only ONE parameter, use it regardless of similarity
            if (paramNames.length === 1) {
              correctedAttr = paramNames[0];
              similarityScore = 1.0; // Perfect match by elimination
              result.attributeCorrections![attr] = correctedAttr;
              result.corrected = true;
              result.warnings.push(`Auto-corrected attribute: ${attr}="${element.attributes[attr]}" → ${correctedAttr}="${element.attributes[attr]}" (only parameter available)`);
              if (session.debug) {
                console.error(`[VALIDATE] Auto-corrected (single param): ${attr} → ${correctedAttr}`);
              }
            } else {
              // Try to find best matching parameter name using similarity
              if (session.debug) {
                console.error(`[VALIDATE] Checking similarity for '${attr}' against:`, paramNames);
              }
              const best = await getBestTagMatch(attr, paramNames);
              if (session.debug) {
                console.error(`[VALIDATE] Best match: ${best.tag} with score ${best.score.toFixed(2)}, cutoff: ${similarityCutoff}`);
              }
              if (best.score >= similarityCutoff) {
                correctedAttr = best.tag;
                similarityScore = best.score;
                result.attributeCorrections![attr] = correctedAttr;
                result.corrected = true;
                result.warnings.push(`Auto-corrected attribute: ${attr}="${element.attributes[attr]}" → ${correctedAttr}="${element.attributes[attr]}" (similarity: ${similarityScore.toFixed(2)})`);
                if (session.debug) {
                  console.error(`[VALIDATE] Auto-corrected (similarity): ${attr} → ${correctedAttr}`);
                }
              } else {
                result.warnings.push(`Unknown attribute: ${attr} (no similar match found, best: ${best.tag} with score ${best.score.toFixed(2)})`);
                if (session.debug) {
                  console.error(`[VALIDATE] No correction (score too low): ${attr}, best was ${best.tag} (${best.score.toFixed(2)})`);
                }
              }
            }
          } else {
            result.warnings.push(`Unknown attribute: ${attr}`);
          }
        }
      }
      
      // Type validation: check if parameter values match expected types
      for (const attr in element.attributes) {
        const param = sub.parameters.find(p => p.name === attr);
        const attrValue = element.attributes[attr];
        
        // Check for invalid XML tags in attribute values
        const attrValueCheck = validateAttributeValue(attr, attrValue);
        if (!attrValueCheck.valid && attrValueCheck.error) {
          result.errors.push(attrValueCheck.error);
        }
        if (attrValueCheck.warning) {
          result.warnings.push(attrValueCheck.warning);
        }
        
        // Type checking
        if (param && param.type) {
          const typeCheck = validateParameterType(attr, attrValue, param.type);
          if (!typeCheck.valid && typeCheck.error) {
            result.typeErrors!.push(typeCheck.error);
            result.errors.push(typeCheck.error);
          }
        }
      }
      
      // Deep validation: if this is a subroutine definition, validate all nested tags
      if (deepValidation && tagName === 'subroutine' && element.children && element.children.length > 0) {
        if (session.debug) {
          console.error(`[VALIDATE] Deep validation of <subroutine name="${element.attributes.name}">`);
        }
        result.nestedValidation = await validateNestedTags(session, element, options);
        
        // Collect errors from nested validation
        for (const nestedResult of result.nestedValidation) {
          if (!nestedResult.valid) {
            result.warnings.push(`Nested tag <${nestedResult.originalTag}>: ${nestedResult.errors.join(', ')}`);
          }
        }
        
        // Scope validation: check parameter and variable references
        const { validateSubroutineScope } = await import('./scope-validator.js');
        result.scopeValidation = validateSubroutineScope(element);
        
        if (session.debug) {
          console.error(`[VALIDATE] Scope validation for <subroutine name="${element.attributes.name}">:`, {
            errors: result.scopeValidation.errors.length,
            warnings: result.scopeValidation.warnings.length,
            undefinedParams: result.scopeValidation.undefinedParameters,
            undefinedVars: result.scopeValidation.undefinedVariables,
            unusedParams: result.scopeValidation.unusedParameters,
            unusedVars: result.scopeValidation.unusedVariables,
          });
        }
        
        // Add scope warnings to main warnings
        if (result.scopeValidation.warnings.length > 0) {
          result.warnings.push(...result.scopeValidation.warnings.map(w => `Scope: ${w}`));
        }
        
        // Add scope errors to main errors (if any)
        if (result.scopeValidation.errors.length > 0) {
          result.errors.push(...result.scopeValidation.errors.map(e => `Scope: ${e}`));
        }
      }
    }
    
    result.valid = result.errors.length === 0;
  } else {
    // Tag doesn't exist, try to find semantic match
    const best = await getBestTagMatch(tagName, Array.from(allowed));
    
    if (best.score >= similarityCutoff) {
      result.similarity = best.score;
      
      if (autocorrect) {
        result.tagName = best.tag;
        result.corrected = true;
        result.warnings.push(`Auto-corrected from <${tagName}> to <${best.tag}> (similarity: ${best.score.toFixed(2)})`);
        
        // Validate parameters for corrected tag
        const sub = subroutines.find(s => s.name === best.tag);
        if (sub && Array.isArray(sub.parameters)) {
          const paramNames = sub.parameters.map(p => p.name);
          
          for (const param of sub.parameters) {
            if (param.required && !(param.name in element.attributes)) {
              result.errors.push(`Missing required parameter: ${param.name}`);
            }
          }
          
          // Check for unknown attributes and auto-correct
          for (const attr in element.attributes) {
            if (!paramNames.includes(attr)) {
              if (paramNames.length > 0) {
                // Special case: if there's only ONE parameter, use it regardless of similarity
                if (paramNames.length === 1) {
                  result.attributeCorrections![attr] = paramNames[0];
                  result.warnings.push(`Auto-corrected attribute: ${attr}="${element.attributes[attr]}" → ${paramNames[0]}="${element.attributes[attr]}" (only parameter available)`);
                } else {
                  // Try to find best matching parameter name using similarity
                  const attrBest = await getBestTagMatch(attr, paramNames);
                  if (attrBest.score >= similarityCutoff) {
                    result.attributeCorrections![attr] = attrBest.tag;
                    result.warnings.push(`Auto-corrected attribute: ${attr}="${element.attributes[attr]}" → ${attrBest.tag}="${element.attributes[attr]}" (similarity: ${attrBest.score.toFixed(2)})`);
                  } else {
                    result.warnings.push(`Unknown attribute: ${attr} (no similar match found, best: ${attrBest.tag} with score ${attrBest.score.toFixed(2)})`);
                  }
                }
              } else {
                result.warnings.push(`Unknown attribute: ${attr}`);
              }
            }
          }
        }
        
        result.valid = result.errors.length === 0;
      } else {
        result.errors.push(`Tag <${tagName}> does not exist. Did you mean <${best.tag}>? (similarity: ${best.score.toFixed(2)})`);
      }
    } else {
      result.errors.push(`Tag <${tagName}> does not exist and no similar tag was found.`);
    }
  }
  
  return result;
}

/**
 * Validate all child tags in a parsed Dirac AST
 */
export async function validateDiracCode(
  session: DiracSession,
  ast: DiracElement,
  options: {
    autocorrect?: boolean;
    similarityCutoff?: number;
    deepValidation?: boolean; // Enable deep validation of nested tags
  } = {}
): Promise<{
  valid: boolean;
  results: ValidationResult[];
  errorMessages: string[];
  typeErrors: string[];
}> {
  const results: ValidationResult[] = [];
  const errorMessages: string[] = [];
  const typeErrors: string[] = [];
  
  // IMPORTANT: Extract subroutine names defined in this AST so we can validate calls to them
  const localSubroutineNames = new Set<string>();
  const localSubroutineElements = new Map<string, DiracElement>();
  function extractLocalSubroutines(element: DiracElement) {
    if (element.tag === 'subroutine' && element.attributes.name) {
      localSubroutineNames.add(element.attributes.name);
      localSubroutineElements.set(element.attributes.name, element);
    }
    for (const child of element.children) {
      extractLocalSubroutines(child);
    }
  }
  extractLocalSubroutines(ast);
  
  if (localSubroutineNames.size > 0 && session.debug) {
    console.error(`[VALIDATE] Found ${localSubroutineNames.size} local subroutine definitions:`, Array.from(localSubroutineNames));
  }
  
  // Temporarily add local subroutines to session for validation
  const tempSubroutines: any[] = [];
  for (const subName of localSubroutineNames) {
    const subElement = localSubroutineElements.get(subName)!;
    
    // Extract parameters from param-* attributes
    const parameters: any[] = [];
    for (const attr in subElement.attributes) {
      if (attr.startsWith('param-')) {
        const paramName = attr.slice(6); // Remove 'param-' prefix
        const paramSpec = subElement.attributes[attr];
        // Parse "type:required|optional:description:example"
        const parts = paramSpec.split(':');
        parameters.push({
          name: paramName,
          type: parts[0] || 'string',
          required: parts[1] === 'required',
          description: parts[2] || '',
          example: parts[3] || '',
        });
      }
    }
    
    if (session.debug) {
      console.error(`[VALIDATE] Temp subroutine '${subName}' has ${parameters.length} parameters:`, parameters.map(p => p.name));
    }
    
    const tempSub = {
      name: subName,
      element: subElement,
      boundary: session.variables.length,
      parameters: parameters,
    };
    session.subroutines.push(tempSub);
    tempSubroutines.push(tempSub);
  }
  
  // Recursively validate all elements
  async function validateElement(element: DiracElement) {
    // Skip text nodes, whitespace-only tags, and root wrapper tags
    if (element.tag && element.tag !== 'dirac' && element.tag !== 'DIRAC-ROOT' && element.tag.trim() !== '') {
      const result = await validateTag(session, element, options);
      results.push(result);
      
      if (!result.valid) {
        errorMessages.push(`<${result.originalTag}>: ${result.errors.join(', ')}`);
      }
      
      // Collect type errors
      if (result.typeErrors && result.typeErrors.length > 0) {
        typeErrors.push(...result.typeErrors);
      }
    }
    
    // Validate children
    for (const child of element.children) {
      await validateElement(child);
    }
  }
  
  await validateElement(ast);
  
  // Remove temporary subroutines from session
  for (const tempSub of tempSubroutines) {
    const index = session.subroutines.indexOf(tempSub);
    if (index > -1) {
      session.subroutines.splice(index, 1);
    }
  }
  
  return {
    valid: errorMessages.length === 0,
    results,
    errorMessages,
    typeErrors,
  };
}

/**
 * Apply auto-corrections to a parsed Dirac AST
 */
export function applyCorrectedTags(session: DiracSession, ast: DiracElement, results: ValidationResult[]): DiracElement {
  let resultIndex = 0;
  
  function correctElement(element: DiracElement): DiracElement {
    // Skip text nodes, whitespace-only tags, and root wrapper tags (must match validateElement logic)
    const shouldProcess = element.tag && element.tag !== 'dirac' && element.tag !== 'DIRAC-ROOT' && element.tag.trim() !== '';
    
    if (shouldProcess && resultIndex < results.length) {
      const result = results[resultIndex++];
      
      if (session.debug) {
        console.error(`[APPLY-CORRECTION] Processing <${element.tag}> with result #${resultIndex-1} for <${result.originalTag}>, corrected: ${result.corrected}`);
      }
      
      // Correct tag name if needed
      if (result.corrected && result.tagName !== element.tag) {
        if (session.debug) {
          console.error(`[APPLY-CORRECTION] Tag: ${element.tag} → ${result.tagName}`);
        }
        element = { ...element, tag: result.tagName };
      }
      
      // Correct attribute names if any
      if (result.attributeCorrections && Object.keys(result.attributeCorrections).length > 0) {
        if (session.debug) {
          console.error(`[APPLY-CORRECTION] Attributes on <${element.tag}>:`, result.attributeCorrections);
        }
        const newAttributes: { [key: string]: string } = {};
        for (const [oldAttr, value] of Object.entries(element.attributes)) {
          const newAttr = result.attributeCorrections[oldAttr] || oldAttr;
          if (newAttr !== oldAttr && session.debug) {
            console.error(`[APPLY-CORRECTION]   ${oldAttr}="${value}" → ${newAttr}="${value}"`);
          }
          newAttributes[newAttr] = value;
        }
        element = { ...element, attributes: newAttributes };
      }
    } else if (shouldProcess && session.debug) {
      console.error(`[APPLY-CORRECTION] WARNING: No result for <${element.tag}> at index ${resultIndex} (total results: ${results.length})`);
    }
    
    // Always process children, preserving element structure
    return {
      ...element,
      children: element.children.map(child => correctElement(child))
    };
  }
  
  return correctElement(ast);
}
