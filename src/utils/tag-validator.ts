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
    const data = await response.json();
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
  };
  
  // Check if tag exists
  if (allowed.has(tagName)) {
    // Tag name is valid, now check required and unknown parameters
    const sub = subroutines.find(s => s.name === tagName);
    if (sub && Array.isArray(sub.parameters)) {
      const paramNames = sub.parameters.map(p => p.name);
      
      // Check for missing required parameters
      for (const param of sub.parameters) {
        if (param.required && !(param.name in element.attributes)) {
          result.errors.push(`Missing required parameter: ${param.name}`);
        }
      }
      
      // Check for unknown attributes
      for (const attr in element.attributes) {
        if (!paramNames.includes(attr)) {
          result.warnings.push(`Unknown attribute: ${attr}`);
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
          
          for (const attr in element.attributes) {
            if (!paramNames.includes(attr)) {
              result.warnings.push(`Unknown attribute: ${attr}`);
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
    if (element.tag && element.tag !== 'dirac' && element.tag !== '') {
      const result = results[resultIndex++];
      if (result && result.corrected) {
        element = { ...element, tag: result.tagName };
      }
    }
    
    return {
      ...element,
      children: element.children.map(child => correctElement(child))
    };
  }
  
  return correctElement(ast);
}
