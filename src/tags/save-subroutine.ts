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
 *   - format: 'xml' or 'braket' (default: 'xml' for indexing compatibility)
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
  const format = element.attributes.format || 'xml'; // Default to 'xml' for indexing compatibility
  
  if (!name) {
    throw new Error('<save-subroutine> requires name attribute');
  }
  
  // Collect all versions from bottom to top so re-import preserves override order.
  const matchingSubroutines = session.subroutines.filter((sub) => sub.name === name);

  if (matchingSubroutines.length === 0) {
    throw new Error(`Subroutine '${name}' not found in session`);
  }

  const latestSubroutine = matchingSubroutines[matchingSubroutines.length - 1];
  
  // Generate the output based on format
  let content: string;
  
  if (format === 'braket') {
    content = generateBraKetBundleNotation(matchingSubroutines);
  } else {
    content = generateXMLBundleNotation(matchingSubroutines);
  }
  
  // Determine file path with simplified logic
  let filePath: string;
  
  if (file) {
    // Explicit file path (user override)
    filePath = resolve(process.cwd(), file);
  } else if (latestSubroutine.sourcePath && existsSync(dirname(latestSubroutine.sourcePath))) {
    // Use existing sourcePath if available (for edited subroutines)
    filePath = latestSubroutine.sourcePath;
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
  
  if (matchingSubroutines.length > 1) {
    emit(session, `Subroutine chain '${name}' (${matchingSubroutines.length} versions) saved to: ${filePath}\n`);
  } else {
    emit(session, `Subroutine '${name}' saved to: ${filePath}\n`);
  }
  
  // Update metadata for all saved versions.
  for (const savedSub of session.subroutines) {
    if (savedSub.name === name) {
      savedSub.sourcePath = filePath;
      savedSub.modified = false;
    }
  }
  
  if (session.debug) {
    console.error(`[save-subroutine] Saved '${name}' (${matchingSubroutines.length} version(s)) to: ${filePath}`);
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

function generateXMLBundleNotation(subroutines: any[]): string {
  const sections: string[] = ['<!-- Exported subroutine chain -->', ''];
  for (const subroutine of subroutines) {
    sections.push(generateXMLNotation(subroutine, false).trimEnd());
    sections.push('');
  }
  return sections.join('\n').trimEnd() + '\n';
}

function generateBraKetBundleNotation(subroutines: any[]): string {
  const sections: string[] = [];
  for (const subroutine of subroutines) {
    sections.push(generateBraKetNotation(subroutine));
  }
  return sections.join('\n\n') + '\n';
}

/**
 * Generate XML notation for a subroutine
 */
function generateXMLNotation(subroutine: any, includeHeader: boolean = true): string {
  let xml = '';

  if (includeHeader) {
    xml += '<!-- Exported subroutine -->\n\n';
  }
  
  xml += `<subroutine name="${subroutine.name}"`;
  
  // Add all original attributes from the subroutine element (except name and param-*)
  if (subroutine.element && subroutine.element.attributes) {
    for (const [attrName, attrValue] of Object.entries(subroutine.element.attributes)) {
      // Skip name (already added) and param-* (handled separately below)
      if (attrName === 'name' || attrName.startsWith('param-') || attrName.startsWith('meta-')) {
        continue;
      }
      xml += `\n            ${attrName}="${escapeXml(String(attrValue))}"`;
    }
  }
  
  // Add description if present (may already be in attributes above, but ensure it's there)
  if (subroutine.description && !subroutine.element?.attributes?.description) {
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
  const lines: string[] = [];
  
  // Serialize the element in bra-ket notation (reusing edit-subroutine's logic)
  serializeElementToBraKet(subroutine.element, lines, 0);
  
  return lines.join('\n');
}

/**
 * Serialize element to bra-ket notation (copied from edit-subroutine for consistency)
 */
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
    
    // Add ALL attributes (except name and meta-*) BEFORE the |
    // Parameters go BEFORE the | in bra notation
    if (el.attributes) {
      for (const [key, value] of Object.entries(el.attributes)) {
        if (key !== 'name' && !key.startsWith('meta-') && typeof value === 'string') {
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
