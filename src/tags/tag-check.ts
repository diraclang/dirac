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
  const allowed = new Set(getAvailableSubroutines(session).map(s => s.name));
  console.error('[tag-check] Allowed subroutines:', Array.from(allowed));

  for (const child of element.children) {
    const tagName = child.tag;
    console.error(`[tag-check] Checking tag: <${tagName}>`);
    if (allowed.has(tagName)) {
      console.error(`[tag-check] <${tagName}/> is valid.`);
      emit(session, `<${tagName}/> is valid.`);
    } else {
      // Find best semantic match
      console.error(`[tag-check] <${tagName}/> not found, searching for best match...`);
      const best = await getBestTagMatch(tagName, Array.from(allowed));
      console.error(`[tag-check] Best match: <${best.tag}> (score: ${best.score})`);
      if (best.score >= SIMILARITY_CUTOFF) {
        emit(session, `The tag <${tagName}> does not exist. Did you mean <${best.tag}>? (similarity: ${best.score.toFixed(2)})`);
      } else {
        emit(session, `The tag <${tagName}> does not exist and no similar tag was found.`);
      }
    }
  }
}
