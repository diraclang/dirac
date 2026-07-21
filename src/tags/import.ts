/**
 * <import> tag - Import subroutines from other Dirac files
 * Similar to Node.js require/import
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { DiracParser } from '../runtime/parser.js';
import { BraKetParser } from '../runtime/braket-parser.js';
import { integrate } from '../runtime/interpreter.js';
import { substituteAttribute } from '../runtime/session.js';
import { homedir } from 'os';

/**
 * Resolve import path with comprehensive strategy:
 * 1. Absolute paths (starts with /)
 * 2. Home expansion (starts with ~/)
 * 3. Relative to current file (starts with ./ or ../)
 * 4. DIRAC_LIBS environment variable (colon-separated paths)
 * 5. config.yml libraryPaths
 * 6. node_modules (npm packages)
 * 7. Error if not found
 * 
 * @param src - The import source (e.g., "./file.di", "dirac-stdlib/lib/telegram.di")
 * @param currentDir - Current directory context
 * @param libraryPaths - Additional library paths from config.yml
 * @returns Resolved absolute path
 */
function resolveImportPath(src: string, currentDir: string, libraryPaths: string[] = []): string {
  // Helper to add .di extension if not present
  const ensureDiExtension = (path: string) => path.endsWith('.di') ? path : path + '.di';
  
  // Helper to try resolving in a base directory
  const tryResolveInBase = (basePath: string, modulePath: string): string | null => {
    const fullPath = join(basePath, modulePath);
    const withExtension = ensureDiExtension(fullPath);
    if (existsSync(withExtension)) {
      return withExtension;
    }
    return null;
  };
  
  // 1. Absolute paths (starts with /)
  if (src.startsWith('/')) {
    const resolved = ensureDiExtension(src);
    if (existsSync(resolved)) {
      return resolved;
    }
    throw new Error(`Absolute path not found: ${resolved}`);
  }
  
  // 2. Home expansion (starts with ~/)
  if (src.startsWith('~/')) {
    const expanded = join(homedir(), src.slice(2));
    const resolved = ensureDiExtension(expanded);
    if (existsSync(resolved)) {
      return resolved;
    }
    throw new Error(`Home path not found: ${resolved}`);
  }
  
  // 3. Relative to current file (starts with ./ or ../)
  if (src.startsWith('./') || src.startsWith('../')) {
    const resolved = resolve(currentDir, src);
    const withExtension = ensureDiExtension(resolved);
    if (existsSync(withExtension)) {
      return withExtension;
    }
    throw new Error(`Relative path not found: ${withExtension}`);
  }
  
  // 4. DIRAC_LIBS environment variable (colon-separated paths)
  const diracLibs = process.env.DIRAC_LIBS;
  if (diracLibs) {
    const libPaths = diracLibs.split(':').filter(p => p.trim());
    for (const libPath of libPaths) {
      const expandedLibPath = libPath.startsWith('~') 
        ? join(homedir(), libPath.slice(1))
        : libPath;
      
      const resolved = tryResolveInBase(expandedLibPath, src);
      if (resolved) {
        return resolved;
      }
    }
  }
  
  // 5. config.yml libraryPaths
  for (const libPath of libraryPaths) {
    const expandedLibPath = libPath.startsWith('~')
      ? join(homedir(), libPath.slice(1))
      : libPath;
    
    const resolved = tryResolveInBase(expandedLibPath, src);
    if (resolved) {
      return resolved;
    }
  }
  
  // 6. node_modules (npm packages)
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
      
      throw new Error(`Package "${src}" found in node_modules but no entry point (.di file) available`);
    }
    
    // Move up one directory
    const parentDir = dirname(searchDir);
    if (parentDir === searchDir) {
      // Reached root, package not found
      break;
    }
    searchDir = parentDir;
  }
  
  // 7. Not found anywhere
  throw new Error(`Module not found: ${src}
Searched in:
  - Absolute/Home paths
  - Relative to: ${currentDir}
  - DIRAC_LIBS: ${diracLibs || '(not set)'}
  - libraryPaths: ${libraryPaths.join(', ') || '(none)'}
  - node_modules (walked up from ${currentDir})
  
Hint: Set DIRAC_LIBS environment variable for development (e.g., export DIRAC_LIBS=~/diraclang)
      Or add libraryPaths to config.yml for project-specific paths`);
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
  
  // Get library paths from session config
  const libraryPaths = session.libraryPaths || [];
  
  // Resolve the import path with comprehensive strategy
  const importPath = resolveImportPath(src, currentDir, libraryPaths);
  
  if (session.debug) {
    console.error(`[IMPORT] Resolved: ${src} -> ${importPath}`);
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
    let source = readFileSync(importPath, 'utf-8');
    
    // Check if it's braket notation and convert to XML
    // Look for lines that start with | (ket) or end with | (bra)
    const lines = source.split('\n');
    let isBraket = false;
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (trimmed.startsWith('<!--') || trimmed === '') continue;
      // Check for ket tag (line starts with |)
      if (/^\s*\|[a-z0-9_-]+/i.test(line)) {
        isBraket = true;
        break;
      }
      // Check for bra tag (< followed by tag name and ending with |)
      if (/^\s*<[a-z0-9_-]+[^>]*\|\s*$/i.test(line)) {
        isBraket = true;
        break;
      }
    }
    
    if (isBraket) {
      const braketParser = new BraKetParser();
      source = braketParser.parse(source);
      
      if (session.debug) {
        console.error('[IMPORT] Converted from braket notation to XML');
      }
    }
    
    const parser = new DiracParser();
    const ast = parser.parse(source);
    
    // Debug: Show the parsed structure
    if (session.debug) {
      console.error('[IMPORT] Parsed AST:', JSON.stringify(ast, null, 2));
    }
    
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
