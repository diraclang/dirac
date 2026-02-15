/**
 * <import> tag - Import subroutines from other Dirac files
 * Similar to Node.js require/import
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { DiracParser } from '../runtime/parser.js';
import { integrate } from '../runtime/interpreter.js';
import { substituteAttribute } from '../runtime/session.js';

/**
 * Resolve import path - supports relative paths and node_modules packages
 * @param src - The import source (e.g., "./file.di" or "package-name")
 * @param currentDir - Current directory context
 * @returns Resolved absolute path
 */
function resolveImportPath(src: string, currentDir: string): string {
  // If it starts with ./ or ../ or /, it's a relative/absolute path
  if (src.startsWith('./') || src.startsWith('../') || src.startsWith('/')) {
    const resolved = resolve(currentDir, src);
    // Add .di extension if not present
    return resolved.endsWith('.di') ? resolved : resolved + '.di';
  }
  
  // Otherwise, try to resolve as a package from node_modules
  // Walk up the directory tree looking for node_modules
  let searchDir = currentDir;
  
  while (true) {
    const nodeModulesPath = join(searchDir, 'node_modules', src);
    
    if (existsSync(nodeModulesPath)) {
      // Found the package, now find the entry point
      // Try to read package.json to get the "main" field
      const packageJsonPath = join(nodeModulesPath, 'package.json');
      
      if (existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          const mainFile = packageJson.main || 'lib/index.di';
          const entryPath = join(nodeModulesPath, mainFile);
          
          if (existsSync(entryPath)) {
            return entryPath;
          }
        } catch (err) {
          // If package.json parse fails, fall through to default
        }
      }
      
      // Fallback: try common entry points
      const fallbacks = [
        join(nodeModulesPath, 'lib', 'index.di'),
        join(nodeModulesPath, 'index.di'),
      ];
      
      for (const fallback of fallbacks) {
        if (existsSync(fallback)) {
          return fallback;
        }
      }
      
      throw new Error(`Package "${src}" found but no entry point (.di file) available`);
    }
    
    // Move up one directory
    const parentDir = dirname(searchDir);
    if (parentDir === searchDir) {
      // Reached root, package not found
      break;
    }
    searchDir = parentDir;
  }
  
  // Package not found in node_modules, treat as relative path with .di extension
  const resolved = resolve(currentDir, src);
  return resolved.endsWith('.di') ? resolved : resolved + '.di';
}

export async function executeImport(session: DiracSession, element: DiracElement): Promise<void> {
  const srcAttr = element.attributes.src;
  
  if (!srcAttr) {
    throw new Error('<import> requires src attribute');
  }
  
  // Substitute variables in src attribute (e.g., ${pkg})
  const src = substituteAttribute(session, srcAttr);
  
  // Get the current file's directory (if available in session)
  const currentDir = session.currentFile ? dirname(session.currentFile) : process.cwd();
  
  // Resolve the import path (handles both relative paths and node_modules packages)
  const importPath = resolveImportPath(src, currentDir);
  
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
