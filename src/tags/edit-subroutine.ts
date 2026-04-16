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
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
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
  
  // Generate XML for the subroutine
  const xml = serializeSubroutineToXML(subroutine);
  
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
  if (!el || !el.tag) {
    if (el && typeof el === 'string') {
      lines.push(indent + el);
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
  
  // Check for children or text
  const hasChildren = el.children && el.children.length > 0;
  const hasText = el.text && el.text.trim();
  
  if (!hasChildren && !hasText) {
    // Self-closing
    lines.push(tag + ' />');
  } else if (hasText && !hasChildren) {
    // Text only
    lines.push(tag + '>' + el.text + `</${el.tag}>`);
  } else {
    // Has children
    lines.push(tag + '>');
    
    if (hasText) {
      lines.push(indent + '  ' + el.text);
    }
    
    if (hasChildren) {
      for (const child of el.children) {
        serializeElement(child, lines, indent + '  ');
      }
    }
    
    lines.push(`${indent}</${el.tag}>`);
  }
}
