/**
 * Utility functions for serializing subroutines to various formats
 */

/**
 * Serialize a subroutine for training data (XML format, without header comments)
 */
export function serializeSubroutineForTraining(sub: any): string {
  const lines: string[] = [];
  
  // Serialize the element (no header comment for training)
  serializeElement(sub.element, lines, '');
  
  return lines.join('\n');
}

/**
 * Serialize a subroutine to XML format with header comment
 */
export function serializeSubroutineToXML(sub: any): string {
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
      // Skip whitespace-only text nodes
      const trimmedText = el.text.trim();
      if (trimmedText === '') {
        return;
      }

      const literalText = el.literal
        ? `<![CDATA[${trimmedText}]]>`
        : trimmedText;

      let lastIdx = lines.length - 1;
      if (lastIdx >= 0 && !lines[lastIdx].endsWith('>')) {
        // Append to current line
        lines[lastIdx] += literalText;
      } else {
        // Start new line with text
        lines.push(indent + literalText);
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
        // Text node - skip if whitespace-only
        if (child.text) {
          const trimmedText = child.text.trim();
          if (trimmedText === '') {
            continue; // Skip whitespace-only nodes
          }

          // Preserve literal fenced blocks as CDATA instead of reinterpreting them as XML.
          const textValue = child.literal ? `<![CDATA[${trimmedText}]]>` : trimmedText;

          // Append trimmed text inline
          lastIdx = lines.length - 1;
          lines[lastIdx] += textValue;
        }
      } else {
        // Element child - check if it's complex
        const isComplex = child.children && child.children.length > 0;
        
        if (isComplex) {
          allInline = false;
          // Complex child - render on new line with increased indent
          serializeElement(child, lines, indent + '  ');
        } else {
          // Simple child - try to inline
          let childTag = `<${child.tag}`;
          if (child.attributes) {
            for (const [key, value] of Object.entries(child.attributes)) {
              if (typeof value === 'string') {
                childTag += ` ${key}="${value.replace(/"/g, '&quot;')}"`;
              }
            }
          }
          childTag += ' />';
          
          lastIdx = lines.length - 1;
          lines[lastIdx] += childTag;
        }
      }
    }
    
    // Closing tag
    lastIdx = lines.length - 1;
    if (allInline && lines[lastIdx].indexOf('<') > 0) {
      // All inline - close on same line
      lines[lastIdx] += `</${el.tag}>`;
    } else {
      // Has complex children - close on new line
      lines.push(`${indent}</${el.tag}>`);
    }
  }
}

/**
 * Serialize a subroutine to bra-ket format
 */
export function serializeSubroutineToBraKet(sub: any): string {
  const lines: string[] = [];
  
  // Add comment header
  lines.push('<!-- Editing subroutine: ' + sub.name + ' -->');
  lines.push('');
  
  // Serialize the element in bra-ket notation
  serializeElementToBraKet(sub.element, lines, 0);
  
  return lines.join('\n');
}

function serializeElementToBraKet(el: any, lines: string[], indent: number): void {
  const indentStr = '  '.repeat(indent);
  
  // Handle text nodes (tag is empty string)
  if (!el.tag || el.tag === '') {
    if (el.text) {
      // Skip whitespace-only text nodes
      const trimmedText = el.text.trim();
      if (trimmedText === '') {
        return;
      }

      const literalText = el.literal ? `<![CDATA[${trimmedText}]]>` : trimmedText;
      lines.push(indentStr + literalText);
    }
    return;
  }
  
  // Check for bra-style (opening) tags
  if (el.tag === 'subroutine') {
    // Use bra notation: <name|
    const name = el.attributes?.name || 'unnamed';
    let braLine = `${indentStr}<${name}|`;
    
    // Add other attributes
    if (el.attributes) {
      for (const [key, value] of Object.entries(el.attributes)) {
        if (key === 'name') continue; // Already used in bra
        const needsQuotes = typeof value === 'string' && (value.includes(' ') || value.includes('='));
        braLine += ` ${key}=${needsQuotes ? '"' + value + '"' : value}`;
      }
    }
    
    lines.push(braLine);
    
    // Process children with increased indent
    if (el.children && el.children.length > 0) {
      for (const child of el.children) {
        serializeElementToBraKet(child, lines, indent + 1);
      }
    }
    
    return;
  }
  
  // Use ket notation: |tag attrs>
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
          // Text node - skip whitespace-only
          if (child.text) {
            const trimmedText = child.text.trim();
            if (trimmedText !== '') {
              inlineContent += trimmedText;
            }
          }
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
