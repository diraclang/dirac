/**
 * <save-subroutine> tag - Save a subroutine definition to a file
 * 
 * Usage:
 *   <save-subroutine name="my-sub" file="./my-sub.di" />
 *   <save-subroutine name="ai" file="ai.di" format="xml" />
 *   <save-subroutine name="greeting" file="lib/greeting.di" format="braket" />
 * 
 * This extracts a subroutine from the session and writes it to a file
 * in either XML or bra-ket notation.
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit } from '../runtime/session.js';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

export async function executeSaveSubroutine(session: DiracSession, element: DiracElement): Promise<void> {
  const name = element.attributes.name;
  const file = element.attributes.file;
  const format = element.attributes.format || 'xml'; // 'xml' or 'braket'
  
  if (!name) {
    throw new Error('<save-subroutine> requires name attribute');
  }
  
  if (!file) {
    throw new Error('<save-subroutine> requires file attribute');
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
  
  // Resolve file path (relative to cwd)
  const filePath = resolve(process.cwd(), file);
  
  // Create directory if it doesn't exist
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
  
  // Write to file
  writeFileSync(filePath, content, 'utf-8');
  
  emit(session, `Subroutine '${name}' saved to: ${filePath}\n`);
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
  
  for (const child of children) {
    if (child.text && !child.tag) {
      // Text node
      xml += indentStr + escapeXml(child.text) + '\n';
    } else if (child.tag) {
      // Element
      xml += indentStr + `<${child.tag}`;
      
      // Attributes
      if (child.attributes) {
        for (const [key, value] of Object.entries(child.attributes)) {
          xml += ` ${key}="${escapeXml(String(value))}"`;
        }
      }
      
      // Self-closing or with children
      if (child.children && child.children.length > 0) {
        xml += '>\n';
        xml += serializeChildren(child.children, indent + 2);
        xml += indentStr + `</${child.tag}>\n`;
      } else if (child.text) {
        xml += `>${escapeXml(child.text)}</${child.tag}>\n`;
      } else {
        xml += ' />\n';
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
      braket += indentStr + child.text + '\n';
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
