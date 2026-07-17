/**
 * <save-subroutine> tag - Save a subroutine definition to a file
 * 
 * Usage:
 *   <save-subroutine name="my-sub" />  <!-- saves to ~/.dirac/lib/TIMESTAMP/my-sub.di -->
 *   <save-subroutine name="my-sub" file="./my-sub.di" />
 *   <save-subroutine name="ai" file="ai.di" format="xml" />
 *   <save-subroutine name="greeting" file="lib/greeting.di" format="braket" />
 *   <save-subroutine name="greet" path="utils" />  <!-- saves to ~/.dirac/lib/utils/greet.di -->
 * 
 * This extracts a subroutine from the session and writes it to a file
 * in either XML or bra-ket notation.
 * 
 * Attributes:
 *   - name: subroutine name (required)
 *   - file: explicit file path (optional, uses default if omitted)
 *   - path: directory name under ~/.dirac/lib/ (optional)
 *   - format: 'xml' or 'braket' (default: 'xml')
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit } from '../runtime/session.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { homedir } from 'os';
import { registry } from './subroutine-index.js';

export async function executeSaveSubroutine(session: DiracSession, element: DiracElement): Promise<void> {
  const name = element.attributes.name;
  const file = element.attributes.file;
  const pathAttr = element.attributes.path;
  const format = element.attributes.format || 'xml'; // 'xml' or 'braket'
  
  if (!name) {
    throw new Error('<save-subroutine> requires name attribute');
  }
  
  // Find the subroutine in the session (get the full object, not just element)
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
  
  // Generate the output based on format
  let content: string;
  
  if (format === 'braket') {
    content = generateBraKetNotation(subroutine);
  } else {
    content = generateXMLNotation(subroutine);
  }
  
  // Determine file path with simplified logic
  let filePath: string;
  
  if (file) {
    // Explicit file path (user override)
    filePath = resolve(process.cwd(), file);
  } else if (subroutine.sourcePath && existsSync(dirname(subroutine.sourcePath))) {
    // Use existing sourcePath if available (for edited subroutines)
    filePath = subroutine.sourcePath;
  } else if (pathAttr) {
    // Path is a directory name under ~/.dirac/lib/
    const targetDir = join(homedir(), '.dirac', 'lib', pathAttr);
    filePath = join(targetDir, `${name}.di`);
  } else {
    // Default: ~/.dirac/lib/user/name.di (canonical location)
    const defaultDir = join(homedir(), '.dirac', 'lib', 'user');
    filePath = join(defaultDir, `${name}.di`);
  }
  
  // Create directory if it doesn't exist
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  // Write to file
  writeFileSync(filePath, content, 'utf-8');
  
  emit(session, `Subroutine '${name}' saved to: ${filePath}\n`);
  
  // Update subroutine metadata: clear modified flag and set sourcePath
  const savedSub = session.subroutines.find(s => s.name === name);
  if (savedSub) {
    savedSub.sourcePath = filePath;
    savedSub.modified = false;
  }
  
  if (session.debug) {
    console.error(`[save-subroutine] Saved '${name}' to: ${filePath}`);
  }
  
  // Re-index the file to update the subroutine registry
  try {
    const count = registry.indexFile(filePath);
    if (session.debug) {
      console.error(`[save-subroutine] Re-indexed ${filePath}: ${count} subroutine(s)`);
    }
  } catch (error) {
    // Don't fail if indexing fails, just warn
    if (session.debug) {
      console.error(`[save-subroutine] Warning: Failed to re-index: ${error}`);
    }
  }
}

/**
 * Generate XML notation for a subroutine
 */
function generateXMLNotation(subroutine: any): string {
  let xml = '<!-- Exported subroutine -->\n\n';
  
  xml += `<subroutine name="${subroutine.name}"`;
  
  // Add description if present
  if (subroutine.description) {
    xml += `\n            description="${escapeXml(subroutine.description)}"`;
  }
  
  // Add parameters
  if (subroutine.parameters && subroutine.parameters.length > 0) {
    for (const param of subroutine.parameters) {
      xml += `\n            param-${param.name}="${param.type || 'any'}`;
      if (param.required) {
        xml += ':required';
      }
      if (param.description) {
        xml += `:${escapeXml(param.description)}`;
      }
      xml += '"';
    }
  }
  
  xml += '>\n';
  
  // Add body from the element's children
  if (subroutine.element && subroutine.element.children && subroutine.element.children.length > 0) {
    xml += serializeChildren(subroutine.element.children, 2);
  } else {
    xml += '  <!-- Subroutine body not available -->\n';
  }
  
  xml += '</subroutine>\n';
  
  return xml;
}

/**
 * Generate bra-ket notation for a subroutine
 */
function generateBraKetNotation(subroutine: any): string {
  let braket = '';
  
  // Opening bra
  braket += `<${subroutine.name}|`;
  
  // Add description
  if (subroutine.description) {
    braket += ` description="${escapeXml(subroutine.description)}"`;
  }
  
  // Add parameters as regular attributes (not param-*)
  if (subroutine.parameters && subroutine.parameters.length > 0) {
    for (const param of subroutine.parameters) {
      braket += ` ${param.name}=${param.type || 'any'}`;
    }
  }
  
  braket += '\n';
  
  // Add body
  if (subroutine.element && subroutine.element.children) {
    braket += serializeChildrenBraKet(subroutine.element.children, 2);
  } else if (subroutine.body) {
    braket += `  ${subroutine.body}\n`;
  } else {
    braket += '  # Subroutine body not available\n';
  }
  
  return braket;
}

/**
 * Serialize children to XML with indentation
 */
function serializeChildren(children: any[], indent: number): string {
  let xml = '';
  const indentStr = ' '.repeat(indent);
  
  // Filter out whitespace-only text nodes
  const filteredChildren = children.filter(child => {
    if (!child.tag && child.text) {
      return child.text.trim() !== '';
    }
    return true;
  });
  
  for (let i = 0; i < filteredChildren.length; i++) {
    const child = filteredChildren[i];
    
    if (child.text && !child.tag) {
      // Text node with content - preserve text but trim whitespace
      xml += child.text.trim();
    } else if (child.tag) {
      // Check if this is the start of a line (need indent)
      const needsIndent = i === 0 || xml.endsWith('\n');
      
      if (needsIndent) {
        xml += indentStr;
      }
      
      // Element
      xml += `<${child.tag}`;
      
      // Attributes
      if (child.attributes) {
        for (const [key, value] of Object.entries(child.attributes)) {
          xml += ` ${key}="${escapeXml(String(value))}"`;
        }
      }
      
      // Self-closing or with children
      if (child.children && child.children.length > 0) {
        xml += '>';
        // Check if all children are whitespace-only text
        const hasOnlyWhitespaceText = child.children.every((c: any) => 
          !c.tag && c.text && c.text.trim() === ''
        );
        
        if (hasOnlyWhitespaceText) {
          // Empty tag - convert to self-closing
          xml = xml.slice(0, -1); // Remove the '>'
          xml += ' />';
        } else {
          // Has content - check if it's mixed (text + elements) or just elements
          const hasTextChildren = child.children.some((c: any) => !c.tag && c.text && c.text.trim() !== '');
          const hasElementChildren = child.children.some((c: any) => c.tag);
          
          if (hasTextChildren && hasElementChildren) {
            // Mixed content - keep all inline
            xml += serializeChildren(child.children, 0);
            xml += `</${child.tag}>`;
          } else if (hasElementChildren) {
            // Only elements - multiline with indentation
            xml += '\n';
            xml += serializeChildren(child.children, indent + 2);
            xml += indentStr + `</${child.tag}>`;
          } else {
            // Only text - inline
            xml += serializeChildren(child.children, 0);
            xml += `</${child.tag}>`;
          }
        }
        
        // Add newline if this is the last child or next is an element
        if (i === filteredChildren.length - 1 || filteredChildren[i + 1]?.tag) {
          xml += '\n';
        }
      } else if (child.text) {
        // Tag with inline text content
        xml += `>${escapeXml(child.text)}</${child.tag}>`;
        // Add newline if this is the last child or next is an element
        if (i === filteredChildren.length - 1 || filteredChildren[i + 1]?.tag) {
          xml += '\n';
        }
      } else {
        // Self-closing tag (no children, no text)
        xml += ' />';
        // Add newline if this is the last child or next is an element (not text)
        if (i === filteredChildren.length - 1 || filteredChildren[i + 1]?.tag) {
          xml += '\n';
        }
      }
    }
  }
  
  return xml;
}

/**
 * Serialize children to bra-ket notation
 */
function serializeChildrenBraKet(children: any[], indent: number): string {
  let braket = '';
  const indentStr = ' '.repeat(indent);
  
  for (const child of children) {
    if (child.text && !child.tag) {
      // Text node - skip whitespace-only text nodes
      const trimmedText = child.text.trim();
      if (trimmedText === '') {
        continue; // Skip whitespace-only nodes
      }
      braket += trimmedText; // Output inline
    } else if (child.tag) {
      braket += indentStr + `|${child.tag}`;
      
      // Attributes
      if (child.attributes) {
        for (const [key, value] of Object.entries(child.attributes)) {
          braket += ` ${key}="${escapeXml(String(value))}"`;
        }
      }
      
      // Content
      if (child.text) {
        braket += `>${child.text}\n`;
      } else if (child.children && child.children.length > 0) {
        braket += '>\n';
        braket += serializeChildrenBraKet(child.children, indent + 2);
      } else {
        braket += '>\n';
      }
    }
  }
  
  return braket;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
