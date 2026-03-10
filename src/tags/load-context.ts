/**
 * <load-context> tag - Load relevant subroutines from registry into session
 * 
 * Usage:
 *   <load-context query="set background color" limit="5" />
 *   <load-context query="string manipulation" import="true" />
 * 
 * This searches the subroutine registry and optionally imports the files
 * containing relevant subroutines into the current session.
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit } from '../runtime/session.js';
import { SubroutineRegistry } from '../runtime/subroutine-registry.js';
import { executeImport } from './import.js';

const registry = new SubroutineRegistry();

export async function executeLoadContext(session: DiracSession, element: DiracElement): Promise<void> {
  // Get query from attribute or text content (like <llm>)
  let query = element.attributes.query;
  
  if (!query && element.text) {
    query = element.text.trim();
  }
  
  if (!query && element.children.length > 0) {
    // Build query from children execution
    const { integrate } = await import('../runtime/interpreter.js');
    const beforeOutput = session.output.length;
    for (const child of element.children) {
      await integrate(session, child);
    }
    const childOutput = session.output.slice(beforeOutput);
    query = childOutput.join('').trim();
    session.output = session.output.slice(0, beforeOutput);
  }
  
  if (!query) {
    throw new Error('<load-context> requires query attribute or text content');
  }
  
  const limitAttr = element.attributes.limit;
  const shouldImport = element.attributes.import !== 'false'; // Default true
  const outputVar = element.attributes.output;
  
  // Check if registry has any subroutines
  const stats = registry.getStats();
  if (stats.totalSubroutines === 0) {
    emit(session, `[load-context] Registry is empty. Use :index <path> or <index-subroutines path="..."> first.\n`);
    return;
  }
  
  const limit = limitAttr ? parseInt(limitAttr, 10) : 5;
  const results = registry.search(query, limit);
  
  if (results.length === 0) {
    emit(session, `[load-context] No subroutines found for query: "${query}". Try indexing more libraries.\n`);
    return;
  }
  
  // Always show what was found (not just in debug)
  emit(session, `[load-context] Found ${results.length} subroutine(s): ${results.map(s => s.name).join(', ')}\n`);
  
  // Group by file path to avoid importing same file multiple times
  const fileMap = new Map<string, typeof results>();
  for (const sub of results) {
    if (!fileMap.has(sub.filePath)) {
      fileMap.set(sub.filePath, []);
    }
    fileMap.get(sub.filePath)!.push(sub);
  }
  
  // Show which files will be imported
  emit(session, `[load-context] Importing ${fileMap.size} file(s)...\n`);
  
  // Import the files if requested
  if (shouldImport) {
    for (const filePath of fileMap.keys()) {
      try {
        // Resolve to absolute path if relative
        const { resolve } = await import('path');
        const absolutePath = filePath.startsWith('/') ? filePath : resolve(process.cwd(), filePath);
        
        // Call executeImport directly instead of parsing XML
        const importElement: DiracElement = {
          tag: 'import',
          attributes: { src: absolutePath },
          children: [],
          text: '',
        };
        await executeImport(session, importElement);
        
        emit(session, `[load-context] ✓ Imported: ${filePath}\n`);
      } catch (error) {
        emit(session, `[load-context] ✗ Failed to import ${filePath}: ${error}\n`);
      }
    }
  } else {
    emit(session, `[load-context] (import=false, not loading files)\n`);
  }
  
  // Store summary in output variable if requested
  if (outputVar) {
    const summary = results.map(s => ({
      name: s.name,
      description: s.description,
      parameters: s.parameters.map(p => p.name),
      filePath: s.filePath,
    }));
    
    const { setVariable } = await import('../runtime/session.js');
    setVariable(session, outputVar, JSON.stringify(summary, null, 2), false);
  }
}
