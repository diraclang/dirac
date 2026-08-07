/**
 * <edit-subroutine> tag - Edit a subroutine in your default editor
 * 
 * Usage:
 *   <edit-subroutine name="my-sub" />
 *   <edit-subroutine name="my-sub" editor="vi" />
 *   <edit-subroutine name="my-sub" editor="code" />
 *   <edit-subroutine name="my-sub" format="xml" />      (default: braket)
 *   <edit-subroutine name="my-sub" format="braket" />
 * 
 * This extracts a subroutine, saves to temp file, opens in editor,
 * then re-imports the edited version.
 * 
 * Attributes:
 *   - name: subroutine name (required)
 *   - editor: editor command (default: $EDITOR or vi)
 *   - format: "braket" or "xml" (default: "braket")
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit } from '../runtime/session.js';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { integrate } from '../runtime/interpreter.js';
import { DiracParser } from '../runtime/parser.js';
import { BraKetParser } from '../runtime/braket-parser.js';

export async function executeEditSubroutine(session: DiracSession, element: DiracElement): Promise<void> {
  const name = element.attributes.name;
  const editor = element.attributes.editor || process.env.EDITOR || process.env.VISUAL || 'vi';
  const format = element.attributes.format || 'xml'; // Default to braket format
  
  if (!name) {
    throw new Error('<edit-subroutine> requires name attribute');
  }
  
  // Find ALL subroutines with the given name (not just the top one)
  const matchingSubroutines: { sub: any, index: number }[] = [];
  for (let i = 0; i < session.subroutines.length; i++) {
    if (session.subroutines[i].name === name) {
      matchingSubroutines.push({ sub: session.subroutines[i], index: i });
    }
  }
  
  if (matchingSubroutines.length === 0) {
    throw new Error(`Subroutine '${name}' not found in session`);
  }
  
  // If multiple versions exist, let user choose which one to edit
  let selectedIndex = 0;
  let subroutine: any;
  let subroutineArrayIndex: number;
  
  if (matchingSubroutines.length > 1) {
    console.error(`\nMultiple versions of '${name}' found:`);
    matchingSubroutines.forEach((item, idx) => {
      const extendsAttr = item.sub.element?.attributes?.extends || 
                          item.sub.element?.attributes?.extend;
      const label = extendsAttr 
        ? `extends="${extendsAttr}"` 
        : '(base)';
      console.error(`  [${idx + 1}] ${name} ${label}`);
    });
    
    // Prompt for selection using synchronous readline
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>((resolve) => {
      rl.question(`\nSelect which to edit (1-${matchingSubroutines.length}): `, (ans) => {
        rl.close();
        resolve(ans);
      });
    });
    
    const selection = parseInt(answer.trim());
    if (isNaN(selection) || selection < 1 || selection > matchingSubroutines.length) {
      throw new Error(`Invalid selection: ${answer}`);
    }
    
    selectedIndex = selection - 1;
    subroutine = matchingSubroutines[selectedIndex].sub;
    subroutineArrayIndex = matchingSubroutines[selectedIndex].index;
    
    console.error(`Editing version ${selection}: ${name} ${
      subroutine.element?.attributes?.extends ? 'extends="' + subroutine.element.attributes.extends + '"' : '(base)'
    }\n`);
  } else {
    // Only one version - edit it directly
    subroutine = matchingSubroutines[0].sub;
    subroutineArrayIndex = matchingSubroutines[0].index;
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
  
  // Convert to requested format
  let content: string;
  if (format === 'braket') {
    content = serializeSubroutineToBraKet(subroutine);
    if (session.debug) {
      console.error(`[edit-subroutine] Using bra-ket format`);
    }
  } else {
    content = xml;
    if (session.debug) {
      console.error(`[edit-subroutine] Using XML format`);
    }
  }
  
  // Always use temp file for editing (don't modify source files directly)
  const tempFile = join(tmpdir(), `dirac-edit-${name}-${Date.now()}.di`);
  writeFileSync(tempFile, content, 'utf-8');
  
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
  
  // Preserve original sourcePath before re-importing
  const originalSourcePath = subroutine.sourcePath;
  const originalBoundary = subroutine.boundary;
  
  // Remove the specific subroutine we edited (at its exact position)
  if (session.debug) {
    console.error(`[edit-subroutine] Removing subroutine at index ${subroutineArrayIndex}`);
  }
  session.subroutines.splice(subroutineArrayIndex, 1);
  
  // Parse and execute the edited subroutine to re-register it
  // If format was braket, convert back to XML first
  let xmlContent: string;
  if (format === 'braket') {
    const braketParser = new BraKetParser();
    xmlContent = braketParser.parse(editedContent);
  } else {
    xmlContent = editedContent;
  }
  
  const parser = new DiracParser();
  const ast = parser.parse(xmlContent);
  await integrate(session, ast);
  
  // The newly registered subroutine is now at the end of the array
  // Move it back to its original position
  const lastIndex = session.subroutines.length - 1;
  const lastSub = session.subroutines[lastIndex];
  
  if (lastSub && lastSub.name === name) {
    // Remove from end
    session.subroutines.splice(lastIndex, 1);
    
    // Insert at original position
    session.subroutines.splice(subroutineArrayIndex, 0, lastSub);
    
    // Mark as modified and restore original metadata
    lastSub.modified = true;
    lastSub.sourcePath = originalSourcePath;
    lastSub.boundary = originalBoundary;
    
    if (session.debug) {
      console.error(`[edit-subroutine] Moved subroutine back to index ${subroutineArrayIndex}`);
    }
  }
  
  emit(session, `Subroutine '${name}' updated in session (use save-subroutine to persist)\n`);
}

/**
 * Serialize a subroutine to bra-ket format
 */
function serializeSubroutineToBraKet(sub: any): string {
  const lines: string[] = [];
  
  // Add comment header
  lines.push(`# Editing subroutine: ${sub.name}`);
  lines.push('');
  
  // Serialize the element in bra-ket notation
  serializeElementToBraKet(sub.element, lines, 0);
  
  return lines.join('\n');
}

function serializeElementToBraKet(el: any, lines: string[], indent: number): void {
  const indentStr = '  '.repeat(indent);
  
  // Handle text nodes
  if (!el.tag || el.tag === '') {
    if (el.text) {
      // Don't add text nodes as separate lines - they'll be handled inline
      // Just return and let parent handle them
    }
    return;
  }
  
  // Special handling for subroutine (use bra notation)
  if (el.tag === 'subroutine') {
    const name = el.attributes?.name || 'unnamed';
    let braLine = `${indentStr}<${name}`;
    
    // Add parameter attributes as direct attributes (not param-)
    // Convert param-xxx to just xxx
    // Parameters go BEFORE the | in bra notation
    if (el.attributes) {
      for (const [key, value] of Object.entries(el.attributes)) {
        if (key !== 'name' && typeof value === 'string') {
          // Remove 'param-' prefix if present
          const attrName = key.startsWith('param-') ? key.substring(6) : key;
          braLine += ` ${attrName}=${value}`;
        }
      }
    }
    
    braLine += '|';
    lines.push(braLine);
    
    // Process children
    if (el.children && el.children.length > 0) {
      for (const child of el.children) {
        serializeElementToBraKet(child, lines, indent + 1);
      }
    }
    
    return;
  }
  
  // Ket notation for all other tags
  let ketLine = `${indentStr}|${el.tag}`;
  
  // Add attributes
  if (el.attributes) {
    for (const [key, value] of Object.entries(el.attributes)) {
      if (typeof value === 'string') {
        // Quote value if it contains spaces
        const needsQuotes = value.includes(' ') || value.includes('=');
        ketLine += ` ${key}=${needsQuotes ? '"' + value + '"' : value}`;
      }
    }
  }
  
  ketLine += '>';
  
  // Check if tag has children - need to detect mixed content (text + elements)
  if (el.children && el.children.length > 0) {
    // Check if content is inline (all text or simple inline elements)
    const hasComplexChildren = el.children.some((c: any) => 
      c.tag && c.tag !== 'variable' && (c.children?.length > 0 || c.tag === 'subroutine')
    );
    
    if (!hasComplexChildren) {
      // Inline content - build it as a single line
      let inlineContent = '';
      for (const child of el.children) {
        if (!child.tag || child.tag === '') {
          // Text node
          inlineContent += child.text || '';
        } else if (child.tag === 'variable') {
          // Inline variable
          const varName = child.attributes?.name || '';
          inlineContent += `|variable name=${varName}>`;
        } else {
          // Other simple inline tag
          inlineContent += `|${child.tag}>`;
        }
      }
      lines.push(ketLine + inlineContent);
    } else {
      // Has complex children - multiline
      lines.push(ketLine);
      for (const child of el.children) {
        serializeElementToBraKet(child, lines, indent + 1);
      }
    }
  } else {
    // Self-closing (no children)
    lines.push(ketLine);
  }
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
