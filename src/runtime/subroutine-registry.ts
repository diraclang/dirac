/**
 * Subroutine Registry with Vector Search
 * Stores subroutine metadata and enables semantic search via embeddings
 * 
 * Architecture:
 * 1. Scan .di files for subroutine definitions
 * 2. Extract name, description, parameters
 * 3. Generate embedding for description
 * 4. Store in vector database
 * 5. Enable semantic search for context-aware imports
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DiracParser } from '../runtime/parser.js';
import type { DiracElement } from '../types/index.js';

export interface SubroutineMetadata {
  name: string;
  description?: string;
  parameters: Array<{
    name: string;
    type?: string;
    required?: boolean;
    description?: string;
  }>;
  filePath: string;
  sourceCode?: string;  // The actual <subroutine>...</subroutine> XML
}

export interface SubroutineIndex {
  subroutines: SubroutineMetadata[];
  lastUpdated: number;
}

export class SubroutineRegistry {
  private indexPath: string;
  private index: SubroutineIndex;

  constructor(indexPath?: string) {
    this.indexPath = indexPath || path.join(os.homedir(), '.dirac', 'subroutine-index.json');
    this.index = this.loadIndex();
  }

  /**
   * Load index from disk
   */
  private loadIndex(): SubroutineIndex {
    if (fs.existsSync(this.indexPath)) {
      try {
        const data = fs.readFileSync(this.indexPath, 'utf-8');
        return JSON.parse(data);
      } catch (err) {
        console.error('Error loading subroutine index:', err);
      }
    }
    
    return {
      subroutines: [],
      lastUpdated: Date.now(),
    };
  }

  /**
   * Save index to disk
   */
  private saveIndex(): void {
    const dir = path.dirname(this.indexPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    this.index.lastUpdated = Date.now();
    fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2), 'utf-8');
  }

  /**
   * Scan a directory for .di files and index all subroutines
   */
  async indexDirectory(dirPath: string): Promise<number> {
    let count = 0;
    
    const scanDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.di')) {
          count += this.indexFile(fullPath);
        }
      }
    };
    
    scanDir(dirPath);
    this.saveIndex();
    return count;
  }

  /**
   * Index a single .di file
   */
  indexFile(filePath: string): number {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parser = new DiracParser();
      const ast = parser.parse(content);
      
      // Remove existing entries for this file
      this.index.subroutines = this.index.subroutines.filter(s => s.filePath !== filePath);
      
      // Extract subroutines
      const subroutines = this.extractSubroutines(ast, filePath);
      this.index.subroutines.push(...subroutines);
      
      return subroutines.length;
    } catch (err) {
      // Silently skip files with parse errors (they likely have invalid syntax)
      // Only log in debug mode
      if (process.env.DEBUG_REGISTRY === '1') {
        console.error(`Error indexing ${filePath}:`, err);
      }
      return 0;
    }
  }

  /**
   * Extract subroutines from AST
   */
  private extractSubroutines(element: DiracElement, filePath: string): SubroutineMetadata[] {
    const subroutines: SubroutineMetadata[] = [];
    
    if (element.tag === 'subroutine') {
      const name = element.attributes.name;
      if (name) {
        const metadata: SubroutineMetadata = {
          name,
          description: element.attributes.description,
          parameters: [],
          filePath,
        };
        
        // Extract param-* attributes
        for (const [attrName, attrValue] of Object.entries(element.attributes)) {
          if (attrName.startsWith('param-')) {
            const paramName = attrName.substring(6);
            const parts = attrValue.split(':');
            metadata.parameters.push({
              name: paramName,
              type: parts[0] || 'any',
              required: parts[1] === 'required',
              description: parts[2],
            });
          }
        }
        
        subroutines.push(metadata);
      }
    }
    
    // Recurse into children
    if (element.children) {
      for (const child of element.children) {
        subroutines.push(...this.extractSubroutines(child, filePath));
      }
    }
    
    return subroutines;
  }

  /**
   * Simple text search (will be replaced with vector search)
   * Supports multi-word queries by tokenizing and matching individual words
   */
  search(query: string, limit: number = 10): SubroutineMetadata[] {
    const lowerQuery = query.toLowerCase();
    
    // Tokenize query into words (split on spaces, hyphens, underscores)
    const queryTokens = lowerQuery.split(/[\s\-_]+/).filter(t => t.length > 0);
    
    const results = this.index.subroutines
      .map(sub => {
        let score = 0;
        const lowerName = sub.name.toLowerCase();
        const lowerDesc = (sub.description || '').toLowerCase();
        
        // Tokenize subroutine name
        const nameTokens = lowerName.split(/[\s\-_]+/);
        
        // Exact full query match in name or description
        if (lowerName === lowerQuery) {
          score += 100;
        } else if (lowerName.includes(lowerQuery)) {
          score += 50;
        } else if (lowerDesc.includes(lowerQuery)) {
          score += 30;
        }
        
        // Multi-word token matching
        let tokenMatchCount = 0;
        for (const queryToken of queryTokens) {
          // Match in name tokens
          if (nameTokens.some(nt => nt === queryToken)) {
            score += 40; // Exact token match
            tokenMatchCount++;
          } else if (nameTokens.some(nt => nt.includes(queryToken))) {
            score += 20; // Partial token match
            tokenMatchCount++;
          }
          
          // Match in description
          if (lowerDesc.includes(queryToken)) {
            score += 15;
            tokenMatchCount++;
          }
          
          // Match in parameters
          for (const param of sub.parameters) {
            const lowerParamName = param.name.toLowerCase();
            if (lowerParamName === queryToken) {
              score += 10;
              tokenMatchCount++;
            } else if (lowerParamName.includes(queryToken)) {
              score += 5;
            }
          }
        }
        
        // Boost if multiple query tokens match
        if (queryTokens.length > 1 && tokenMatchCount >= queryTokens.length * 0.5) {
          score += 25; // At least half the tokens matched
        }
        
        return { sub, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.sub);
    
    return results;
  }

  /**
   * Get all subroutines
   */
  getAll(): SubroutineMetadata[] {
    return this.index.subroutines;
  }

  /**
   * Get statistics
   */
  getStats() {
    const files = new Set(this.index.subroutines.map(s => s.filePath));
    return {
      totalSubroutines: this.index.subroutines.length,
      totalFiles: files.size,
      lastUpdated: new Date(this.index.lastUpdated),
    };
  }
}
