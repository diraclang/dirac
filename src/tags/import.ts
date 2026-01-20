/**
 * <import> tag - Import subroutines from other Dirac files
 * Similar to Node.js require/import
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { DiracParser } from '../runtime/parser.js';
import { integrate } from '../runtime/interpreter.js';

export async function executeImport(session: DiracSession, element: DiracElement): Promise<void> {
  const src = element.attributes.src;
  
  if (!src) {
    throw new Error('<import> requires src attribute');
  }
  
  // Get the current file's directory (if available in session)
  const currentDir = session.currentFile ? dirname(session.currentFile) : process.cwd();
  
  // Resolve the import path
  const importPath = resolve(currentDir, src);
  
  if (session.debug) {
    console.error(`[IMPORT] Loading: ${importPath}`);
  }
  
  // Check if already imported (prevent circular imports)
  if (!session.importedFiles) {
    session.importedFiles = new Set();
  }
  
  if (session.importedFiles.has(importPath)) {
    if (session.debug) {
      console.error(`[IMPORT] Already imported: ${importPath}`);
    }
    return;
  }
  
  session.importedFiles.add(importPath);
  
  try {
    // Read and parse the imported file
    const source = readFileSync(importPath, 'utf-8');
    const parser = new DiracParser();
    const ast = parser.parse(source);
    
    // Save current file context and set new one
    const previousFile = session.currentFile;
    session.currentFile = importPath;
    
    // Execute the imported file (this will register its subroutines)
    await integrate(session, ast);
    
    // Restore previous file context
    session.currentFile = previousFile;
    
    if (session.debug) {
      console.error(`[IMPORT] Loaded: ${importPath}`);
    }
    
  } catch (error) {
    throw new Error(`Import error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
