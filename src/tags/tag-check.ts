/**
 * <tag-check> tag - validates child tags against allowed subroutines
 * If a tag is not found, uses embedding similarity to suggest the closest match.
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit } from '../runtime/session.js';
// Use global fetch (Node.js 18+)
import fs from 'fs';
import yaml from 'js-yaml';

// Configurable similarity cutoff
const SIMILARITY_CUTOFF = 0.75;


// Helper: get embedding server config from config.yml
function getEmbeddingServerConfig() {
  const config = yaml.load(fs.readFileSync('config.yml', 'utf8')) as any;
  const host = config.embeddingServer?.host || 'localhost';
  const port = config.embeddingServer?.port || 11435;
  return { host, port };
}

// Helper: call Ollama embedding API directly
async function getEmbeddings(tags: string[]): Promise<number[][]> {
  const { host, port } = getEmbeddingServerConfig();
  return await Promise.all(tags.map(async tag => {
    const response = await fetch(`http://${host}:${port}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'embeddinggemma', prompt: tag })
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

export async function executeTagCheck(session: DiracSession, element: DiracElement): Promise<void> {
  // Get allowed subroutine names
  const { getAvailableSubroutines } = await import('../runtime/session.js');
  const subroutines = getAvailableSubroutines(session);
  const allowed = new Set(subroutines.map(s => s.name));
  console.error('[tag-check] Allowed subroutines:', Array.from(allowed));

  const autocorrect = element.attributes?.autocorrect === "true";
  const shouldExecute = element.attributes?.execute === "true";

  for (const child of element.children) {
    const tagName = child.tag;
    console.error(`[tag-check] Checking tag: <${tagName}>`);
    let allValid = false;
    let correctedTag: string | null = null;

    if (allowed.has(tagName)) {
      // Tag name is valid, now check required and unknown parameters
      const sub = subroutines.find(s => s.name === tagName);
      let missing: string[] = [];
      let unknown: string[] = [];
      let paramNames: string[] = [];
      if (sub && Array.isArray(sub.parameters)) {
        paramNames = sub.parameters.map(p => p.name);
        for (const param of sub.parameters) {
          if (param.required && !(param.name in child.attributes)) {
            missing.push(param.name);
          }
        }
        for (const attr in child.attributes) {
          if (!paramNames.includes(attr)) {
            unknown.push(attr);
          }
        }
      }
      if (missing.length > 0) {
        emit(session, `<${tagName}/> is missing required parameter(s): ${missing.join(', ')}`);
        console.error(`[tag-check] <${tagName}/> missing required: ${missing.join(', ')}`);
      }
      if (unknown.length > 0) {
        emit(session, `<${tagName}/> has unknown attribute(s): ${unknown.join(', ')}`);
        console.error(`[tag-check] <${tagName}/> unknown attributes: ${unknown.join(', ')}`);
      }
      if (missing.length === 0 && unknown.length === 0) {
        emit(session, `<${tagName}/> is valid.`);
        console.error(`[tag-check] <${tagName}/> is valid.`);
        allValid = true;
      }
    } else {
      // Find best semantic match
      console.error(`[tag-check] <${tagName}/> not found, searching for best match...`);
      const best = await getBestTagMatch(tagName, Array.from(allowed));
      console.error(`[tag-check] Best match: <${best.tag}> (score: ${best.score})`);
      if (best.score >= SIMILARITY_CUTOFF) {
        if (autocorrect) {
          emit(session, `The tag <${tagName}> was auto-corrected to <${best.tag}> (similarity: ${best.score.toFixed(2)})`);
          console.error(`[tag-check] Auto-correcting <${tagName}/> to <${best.tag}>`);
          correctedTag = best.tag;
          // Validate parameters for corrected tag
          const sub = subroutines.find(s => s.name === correctedTag);
          let missing: string[] = [];
          let unknown: string[] = [];
          let paramNames: string[] = [];
          if (sub && Array.isArray(sub.parameters)) {
            paramNames = sub.parameters.map(p => p.name);
            for (const param of sub.parameters) {
              if (param.required && !(param.name in child.attributes)) {
                missing.push(param.name);
              }
            }
            for (const attr in child.attributes) {
              if (!paramNames.includes(attr)) {
                unknown.push(attr);
              }
            }
          }
          if (missing.length > 0) {
            emit(session, `<${correctedTag}/> is missing required parameter(s): ${missing.join(', ')}`);
            console.error(`[tag-check] <${correctedTag}/> missing required: ${missing.join(', ')}`);
          }
          if (unknown.length > 0) {
            emit(session, `<${correctedTag}/> has unknown attribute(s): ${unknown.join(', ')}`);
            console.error(`[tag-check] <${correctedTag}/> unknown attributes: ${unknown.join(', ')}`);
          }
          if (missing.length === 0 && unknown.length === 0) {
            allValid = true;
          }
        } else {
          emit(session, `The tag <${tagName}> does not exist. Did you mean <${best.tag}>? (similarity: ${best.score.toFixed(2)})`);
        }
      } else {
        emit(session, `The tag <${tagName}> does not exist and no similar tag was found.`);
      }
    }
    // If all checks pass and execute="true" is present, execute the child tag
    if (allValid && shouldExecute) {
      const executeTag = correctedTag || tagName;
      console.error(`[tag-check] Executing <${executeTag}/> as all checks passed and execute=true.`);
      // Create a corrected element if tag was auto-corrected
      const elementToExecute = correctedTag ? { ...child, tag: correctedTag } : child;
      // Dynamically import interpreter and execute the child tag
      const { integrate } = await import('../runtime/interpreter.js');
      await integrate(session, elementToExecute);
    }
  }
}
