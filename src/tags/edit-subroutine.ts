/**
 * <edit-subroutine> tag - Edit a subroutine in your default editor
 * 
 * Usage:
 *   <edit-subroutine name="my-sub" />
 *   <edit-subroutine name="my-sub" editor="vi" />
 *   <edit-subroutine name="my-sub" editor="code" />
 * 
 * This extracts a subroutine, saves to temp file, opens in editor,
 * then re-imports the edited version.
 * 
 * Attributes:
 *   - name: subroutine name (required)
 *   - editor: editor command (default: $EDITOR or vi)
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit } from '../runtime/session.js';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { integrate } from '../runtime/interpreter.js';
import { DiracParser } from '../runtime/parser.js';

export async function executeEditSubroutine(session: DiracSession, element: DiracElement): Promise<void> {
  const name = element.attributes.name;
  const editor = element.attributes.editor || process.env.EDITOR || process.env.VISUAL || 'vi';
  
  if (!name) {
    throw new Error('<edit-subroutine> requires name attribute');
  }
  
  // Find the subroutine in the session
  let subroutine: any = undefined;
  for (let i = session.subroutines.length - 1; i >= 0; i--) {
    if (session.subroutines[i].name === name) {
      subroutine = session.subroutines[i];
      break;
    }
  }
  
  if (!subroutine) {
    throw new Error(`Subroutine '${name}' not found in session`);
  }
  
  // Try to load original source if available
  let xml: string;
  
  if (subroutine.sourcePath && existsSync(subroutine.sourcePath)) {
    // Read from original source file to preserve formatting
    try {
      const sourceContent = readFileSync(subroutine.sourcePath, 'utf-8');
      
      // Try to extract just this subroutine from the file
      const match = sourceContent.match(
        new RegExp(`<subroutine\\s+name="${name}"[\\s\\S]*?<\\/subroutine>`, 'i')
      );
      
      if (match) {
        xml = match[0];
        if (session.debug) {
          console.error(`[edit-subroutine] Loaded from source: ${subroutine.sourcePath}`);
        }
      } else {
        // Fallback to serialization
        xml = serializeSubroutineToXML(subroutine);
        if (session.debug) {
          console.error(`[edit-subroutine] Could not extract from source, using serialization`);
        }
      }
    } catch (err) {
      // Fallback to serialization if file read fails
      xml = serializeSubroutineToXML(subroutine);
      if (session.debug) {
        console.error(`[edit-subroutine] Error reading source file, using serialization`);
      }
    }
  } else {
    // No source file - serialize from AST
    xml = serializeSubroutineToXML(subroutine);
    if (session.debug) {
      console.error(`[edit-subroutine] No source file, serializing from AST`);
    }
  }
  
  // Always use temp file for editing (don't modify source files directly)
  const tempFile = join(tmpdir(), `dirac-edit-${name}-${Date.now()}.di`);
  writeFileSync(tempFile, xml, 'utf-8');
  
  if (session.debug) {
    console.error(`[edit-subroutine] Wrote '${name}' to temp file: ${tempFile}`);
    console.error(`[edit-subroutine] Opening with editor: ${editor}`);
  }
  
  // Open editor (blocking)
  const result = spawnSync(editor, [tempFile], {
    stdio: 'inherit', // Pass through stdin/stdout/stderr
    shell: true,
  });
  
  if (result.error) {
    unlinkSync(tempFile);
    throw new Error(`Failed to open editor: ${result.error.message}`);
  }
  
  if (result.status !== 0) {
    unlinkSync(tempFile);
    throw new Error(`Editor exited with code ${result.status}`);
  }
  
  // Read the edited content
  const editedContent = readFileSync(tempFile, 'utf-8');
  
  // Clean up temp file
  unlinkSync(tempFile);
  
  if (session.debug) {
    console.error(`[edit-subroutine] Editor closed, re-importing subroutine`);
  }
  
  // Parse and execute the edited subroutine to re-register it
  const parser = new DiracParser();
  const ast = parser.parse(editedContent);
  await integrate(session, ast);
  
  // Mark the subroutine as modified (edited but not saved to disk)
  const editedSub = session.subroutines.find(s => s.name === name);
  if (editedSub) {
    editedSub.modified = true;
  }
  
  emit(session, `Subroutine '${name}' updated in session (use save-subroutine to persist)\n`);
}

/**
 * Serialize a subroutine to XML format
 */
function serializeSubroutineToXML(sub: any): string {
  const lines: string[] = [];
  
  // Add comment header
  lines.push('<!-- Editing subroutine: ' + sub.name + ' -->');
  lines.push('');
  
  // Serialize the element
  serializeElement(sub.element, lines, '');
  
  return lines.join('\n');
}

function serializeElement(el: any, lines: string[], indent: string): void {
  // Handle text nodes (tag is empty string)
  if (!el.tag || el.tag === '') {
    if (el.text) {
      // Text node - output inline without newline
      let lastIdx = lines.length - 1;
      if (lastIdx >= 0 && !lines[lastIdx].endsWith('>')) {
        // Append to current line
        lines[lastIdx] += el.text;
      } else {
        // Start new line with text
        lines.push(indent + el.text);
      }
    }
    return;
  }
  
  // Opening tag
  let tag = `${indent}<${el.tag}`;
  
  // Add attributes
  if (el.attributes) {
    for (const [key, value] of Object.entries(el.attributes)) {
      if (typeof value === 'string') {
        tag += ` ${key}="${value.replace(/"/g, '&quot;')}"`;
      }
    }
  }
  
  // Check for children
  const hasChildren = el.children && el.children.length > 0;
  
  if (!hasChildren) {
    // Self-closing tag
    let lastIdx = lines.length - 1;
    if (lastIdx >= 0 && !lines[lastIdx].endsWith('>') && !lines[lastIdx].trim().startsWith('<')) {
      // Inline with previous text
      lines[lastIdx] += tag.slice(indent.length) + ' />';
    } else {
      lines.push(tag + ' />');
    }
  } else {
    // Has children - process them in order to preserve mixed content
    let lastIdx = lines.length - 1;
    const shouldInline = lastIdx >= 0 && !lines[lastIdx].endsWith('>');
    
    if (shouldInline) {
      // Inline opening tag
      lines[lastIdx] += tag.slice(indent.length) + '>';
    } else {
      lines.push(tag + '>');
    }
    
    // Process children in order (preserves text/element interleaving)
    let allInline = true;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      
      // Check if this is a text node
      if (!child.tag || child.tag === '') {
        // Text node - keep inline
        lastIdx = lines.length - 1;
        if (child.text) {
          lines[lastIdx] += child.text;
        }
      } else {
        // Element node
        // If we have inline content so far, try to keep element inline too
        const isSimpleVar = child.tag === 'variable' && child.attributes && child.attributes.name;
        
        if (isSimpleVar) {
          // Variable tag - keep inline
          lastIdx = lines.length - 1;
          lines[lastIdx] += `<variable name="${child.attributes.name}" />`;
        } else {
          // Complex child - serialize normally
          allInline = false;
          serializeElement(child, lines, indent + '  ');
        }
      }
    }
    
    // Closing tag
    lastIdx = lines.length - 1;
    if (allInline || lines[lastIdx].indexOf(`<${el.tag}`) !== -1) {
      // Close inline
      lines[lastIdx] += `</${el.tag}>`;
    } else {
      lines.push(`${indent}</${el.tag}>`);
    }
  }
}
