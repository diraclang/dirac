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
 * Validate a single tag element against available subroutines
 */
export async function validateTag(
  session: DiracSession,
  element: DiracElement,
  options: {
    autocorrect?: boolean;
    similarityCutoff?: number;
  } = {}
): Promise<ValidationResult> {
  const { autocorrect = false, similarityCutoff = SIMILARITY_CUTOFF } = options;
  
  // Always log validation (not just in debug mode)
  console.error(`[VALIDATE] Tag: <${element.tag}>, autocorrect: ${autocorrect}, attributes:`, Object.keys(element.attributes));
  
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
  };
  
  // Check if tag exists
  if (allowed.has(tagName)) {
    console.error(`[VALIDATE] Tag <${tagName}> is valid`);
    // Tag name is valid, now check required and unknown parameters
    const sub = subroutines.find(s => s.name === tagName);
    if (sub && Array.isArray(sub.parameters)) {
      const paramNames = sub.parameters.map(p => p.name);
      
      console.error(`[VALIDATE] Tag <${tagName}> has ${paramNames.length} parameters:`, paramNames);
      
      // Check for missing required parameters
      for (const param of sub.parameters) {
        if (param.required && !(param.name in element.attributes)) {
          result.errors.push(`Missing required parameter: ${param.name}`);
        }
      }
      
      // Check for unknown attributes and auto-correct if enabled
      for (const attr in element.attributes) {
        if (!paramNames.includes(attr)) {
          console.error(`[VALIDATE] Unknown attribute '${attr}' on <${tagName}>`);
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
              console.error(`[VALIDATE] Auto-corrected (single param): ${attr} → ${correctedAttr}`);
            } else {
              // Try to find best matching parameter name using similarity
              console.error(`[VALIDATE] Checking similarity for '${attr}' against:`, paramNames);
              const best = await getBestTagMatch(attr, paramNames);
              console.error(`[VALIDATE] Best match: ${best.tag} with score ${best.score.toFixed(2)}, cutoff: ${similarityCutoff}`);
              if (best.score >= similarityCutoff) {
                correctedAttr = best.tag;
                similarityScore = best.score;
                result.attributeCorrections![attr] = correctedAttr;
                result.corrected = true;
                result.warnings.push(`Auto-corrected attribute: ${attr}="${element.attributes[attr]}" → ${correctedAttr}="${element.attributes[attr]}" (similarity: ${similarityScore.toFixed(2)})`);
                console.error(`[VALIDATE] Auto-corrected (similarity): ${attr} → ${correctedAttr}`);
              } else {
                result.warnings.push(`Unknown attribute: ${attr} (no similar match found, best: ${best.tag} with score ${best.score.toFixed(2)})`);
                console.error(`[VALIDATE] No correction (score too low): ${attr}, best was ${best.tag} (${best.score.toFixed(2)})`);
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
  } = {}
): Promise<{
  valid: boolean;
  results: ValidationResult[];
  errorMessages: string[];
}> {
  const results: ValidationResult[] = [];
  const errorMessages: string[] = [];
  
  // Recursively validate all elements
  async function validateElement(element: DiracElement) {
    // Skip text nodes, whitespace-only tags, and root wrapper tags
    if (element.tag && element.tag !== 'dirac' && element.tag !== 'DIRAC-ROOT' && element.tag.trim() !== '') {
      const result = await validateTag(session, element, options);
      results.push(result);
      
      if (!result.valid) {
        errorMessages.push(`<${result.originalTag}>: ${result.errors.join(', ')}`);
      }
    }
    
    // Validate children
    for (const child of element.children) {
      await validateElement(child);
    }
  }
  
  await validateElement(ast);
  
  return {
    valid: errorMessages.length === 0,
    results,
    errorMessages,
  };
}

/**
 * Apply auto-corrections to a parsed Dirac AST
 */
export function applyCorrectedTags(ast: DiracElement, results: ValidationResult[]): DiracElement {
  let resultIndex = 0;
  
  function correctElement(element: DiracElement): DiracElement {
    // Skip text nodes, whitespace-only tags, and root wrapper tags (must match validateElement logic)
    if (element.tag && element.tag !== 'dirac' && element.tag !== 'DIRAC-ROOT' && element.tag.trim() !== '') {
      const result = results[resultIndex++];
      if (result) {
        // Correct tag name if needed
        if (result.corrected && result.tagName !== element.tag) {
          console.error(`[APPLY-CORRECTION] Tag: ${element.tag} → ${result.tagName}`);
          element = { ...element, tag: result.tagName };
        }
        
        // Correct attribute names if any
        if (result.attributeCorrections && Object.keys(result.attributeCorrections).length > 0) {
          console.error(`[APPLY-CORRECTION] Attributes on <${element.tag}>:`, result.attributeCorrections);
          const newAttributes: { [key: string]: string } = {};
          for (const [oldAttr, value] of Object.entries(element.attributes)) {
            const newAttr = result.attributeCorrections[oldAttr] || oldAttr;
            if (newAttr !== oldAttr) {
              console.error(`[APPLY-CORRECTION]   ${oldAttr}="${value}" → ${newAttr}="${value}"`);
            }
            newAttributes[newAttr] = value;
          }
          element = { ...element, attributes: newAttributes };
        }
      }
    }
    
    return {
      ...element,
      children: element.children.map(child => correctElement(child))
    };
  }
  
  return correctElement(ast);
}
