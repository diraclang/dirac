/**
 * Bra-Ket Parser - Converts bra-ket notation to XML
 * 
 * Syntax:
 * - Bra (subroutine): <name| ... defines a subroutine
 * - Ket (everything else): |tag attrs> ... can have children/content
 * - Indentation: Defines scope (like Python/YAML)
 * 
 * Examples:
 *   |output>Hello World          →  <output>Hello World</output>
 *   |variable name=x>            →  <variable name="x"/>
 *   <add|                        →  <subroutine name="add">
 *     |output>test               →    <output>test</output>
 *                                →  </subroutine>
 */

interface BraKetLine {
  indent: number;
  type: 'bra' | 'ket' | 'text' | 'empty';
  tag?: string;
  attrs?: string;
  text?: string;
  raw: string;
}

export class BraKetParser {
  private lines: string[] = [];
  private currentLine = 0;

  /**
   * Parse bra-ket notation and compile to XML
   */
  parse(source: string): string {
    this.lines = source.split('\n');
    this.currentLine = 0;

    const xml: string[] = ['<dirac>'];
    this.parseBlock(xml, -1);
    xml.push('</dirac>');

    return xml.join('\n');
  }

  /**
   * Parse a block of lines at a given indentation level
   */
  private parseBlock(output: string[], parentIndent: number): void {
    while (this.currentLine < this.lines.length) {
      const line = this.parseLine(this.lines[this.currentLine]);

      // Empty lines are preserved as-is
      if (line.type === 'empty') {
        this.currentLine++;
        continue;
      }

      // If indent is less than or equal to parent, we're done with this block
      if (line.indent <= parentIndent) {
        break;
      }

      // Bra: <name| defines a subroutine
      if (line.type === 'bra') {
        const attrs = line.attrs ? ` ${this.convertBraAttributes(line.attrs)}` : '';
        output.push(`${'  '.repeat(line.indent)}<subroutine name="${line.tag}"${attrs}>`);
        this.currentLine++;
        this.parseBlock(output, line.indent);
        output.push(`${'  '.repeat(line.indent)}</subroutine>`);
        continue;
      }

      // Ket: |tag attrs>
      if (line.type === 'ket') {
        const indent = '  '.repeat(line.indent);
        const attrs = line.attrs ? ` ${this.convertKetAttributes(line.attrs, line.tag || '')}` : '';
        
        // Check if next line is more indented (has children/content)
        const nextLine = this.currentLine + 1 < this.lines.length 
          ? this.parseLine(this.lines[this.currentLine + 1])
          : null;

        if (nextLine && nextLine.indent > line.indent && nextLine.type !== 'empty') {
          // Has children - opening tag
          output.push(`${indent}<${line.tag}${attrs}>`);
          this.currentLine++;
          this.parseBlock(output, line.indent);
          output.push(`${indent}</${line.tag}>`);
        } else {
          // Self-closing or inline text
          if (line.text) {
            // Inline text with embedded kets
            const content = this.convertInlineKets(line.text);
            output.push(`${indent}<${line.tag}${attrs}>${content}</${line.tag}>`);
          } else {
            // Self-closing
            output.push(`${indent}<${line.tag}${attrs}/>`);
          }
          this.currentLine++;
        }
        continue;
      }

      // Plain text content
      if (line.type === 'text') {
        const indent = '  '.repeat(line.indent);
        const content = this.convertInlineKets(line.text || '');
        output.push(`${indent}${content}`);
        this.currentLine++;
        continue;
      }
    }
  }

  /**
   * Parse a single line into structured form
   */
  private parseLine(raw: string): BraKetLine {
    // Count leading spaces for indentation
    const match = raw.match(/^(\s*)(.*)/);
    const indent = match ? Math.floor(match[1].length / 2) : 0;
    const content = match ? match[2] : '';

    // Empty line
    if (!content.trim()) {
      return { indent, type: 'empty', raw };
    }

    // Bra: <name| or <name attrs|
    const braMatch = content.match(/^<([a-zA-Z_][a-zA-Z0-9_-]*)\s*([^|]*)\|$/);
    if (braMatch) {
      return {
        indent,
        type: 'bra',
        tag: braMatch[1],
        attrs: braMatch[2].trim() || undefined,
        raw
      };
    }

    // Ket: |tag> or |tag attrs> or |tag>text
    const ketMatch = content.match(/^\|([a-zA-Z_][a-zA-Z0-9_-]*)\s*([^>]*?)>\s*(.*)/);
    if (ketMatch) {
      return {
        indent,
        type: 'ket',
        tag: ketMatch[1],
        attrs: ketMatch[2].trim() || undefined,
        text: ketMatch[3] || undefined,
        raw
      };
    }

    // Plain text
    return {
      indent,
      type: 'text',
      text: content,
      raw
    };
  }

  /**
   * Convert bra-ket attribute syntax to XML
   * Examples:
   *   name=value    → name="value"
   *   x=5 y=10      → x="5" y="10"
   *   select=@*     → select="@*"
   */
  private convertAttributes(attrs: string): string {
    if (!attrs) return '';

    // Split by spaces but respect quoted strings
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < attrs.length; i++) {
      const char = attrs[i];
      
      if ((char === '"' || char === "'") && (i === 0 || attrs[i - 1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
          current += char;
        } else if (char === quoteChar) {
          inQuotes = false;
          current += char;
        } else {
          current += char;
        }
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          parts.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      parts.push(current.trim());
    }

    // Convert each attribute
    return parts.map(part => {
      const match = part.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)=(.+)$/);
      if (!match) return part;

      const [, name, value] = match;
      
      // Already quoted
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        return `${name}=${value}`;
      }

      // Quote it
      return `${name}="${value}"`;
    }).join(' ');
  }

  /**
   * Convert bra-ket attribute syntax to XML for subroutine definitions
   * Automatically converts parameter attributes to param-* format
   * Reserved attributes (description, extends, visible) are kept as-is
   * 
   * Examples:
   *   name=String          → param-name="String"
   *   x=number y=string    → param-x="number" param-y="string"
   *   description=Adds     → description="Adds"  (reserved, no prefix)
   */
  private convertBraAttributes(attrs: string): string {
    if (!attrs) return '';

    // Reserved attributes that don't get param- prefix
    const RESERVED = new Set(['description', 'extends', 'visible']);

    // Split by spaces but respect quoted strings
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < attrs.length; i++) {
      const char = attrs[i];
      
      if ((char === '"' || char === "'") && (i === 0 || attrs[i - 1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
          current += char;
        } else if (char === quoteChar) {
          inQuotes = false;
          current += char;
        } else {
          current += char;
        }
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          parts.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      parts.push(current.trim());
    }

    // Convert each attribute
    return parts.map(part => {
      const match = part.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)=(.+)$/);
      if (!match) return part;

      const [, name, value] = match;
      
      // Check if this is a reserved attribute
      const isReserved = RESERVED.has(name);
      const attrName = isReserved ? name : `param-${name}`;
      
      // Already quoted
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        return `${attrName}=${value}`;
      }

      // Quote it
      return `${attrName}="${value}"`;
    }).join(' ');
  }

  /**
   * Convert ket attribute syntax to XML, supporting positional arguments
   * Detects unnamed values and marks them as _positional-N for runtime resolution
   * 
   * Examples:
   *   |greeting zhi>              → <call name="greeting" _positional-0="zhi"/>
   *   |add 5 10>                 → <call name="add" _positional-0="5" _positional-1="10"/>
   *   |add x=5 y=10>             → <call name="add" x="5" y="10"/>  (named, no change)
   *   |output>Hello              → <output>Hello</output>  (text content, no params)
   */
  private convertKetAttributes(attrs: string, tagName: string): string {
    if (!attrs) return '';

    // Check if attrs contains only values without = (positional args)
    // Split carefully respecting quotes
    const parts = this.parseAttributeParts(attrs);
    
    // Detect if we have any positional arguments (values without =)
    const hasPositional = parts.some(part => !part.includes('='));
    
    if (!hasPositional) {
      // All named attributes, use standard conversion
      return this.convertAttributes(attrs);
    }
    
    // Has positional arguments - mark them with _positional-N
    let positionalIndex = 0;
    return parts.map(part => {
      const match = part.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)=(.+)$/);
      
      if (match) {
        // Named attribute
        const [, name, value] = match;
        const quotedValue = this.quoteValue(value);
        return `${name}=${quotedValue}`;
      } else {
        // Positional argument
        const quotedValue = this.quoteValue(part);
        return `_positional-${positionalIndex++}=${quotedValue}`;
      }
    }).join(' ');
  }

  /**
   * Parse attribute string into parts, respecting quotes
   */
  private parseAttributeParts(attrs: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < attrs.length; i++) {
      const char = attrs[i];
      
      if ((char === '"' || char === "'") && (i === 0 || attrs[i - 1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
          current += char;
        } else if (char === quoteChar) {
          inQuotes = false;
          current += char;
        } else {
          current += char;
        }
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          parts.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts;
  }

  /**
   * Quote a value if not already quoted
   */
  private quoteValue(value: string): string {
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value;
    }
    return `"${value}"`;
  }

  /**
   * Escape XML special characters in text content
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')   // Must be first!
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Convert inline kets within text content
   * Example: "Hello |variable name=x> world" → "Hello <variable name="x"/> world"
   * Example: "if x < 10 and y > 5" → "if x &lt; 10 and y &gt; 5"
   */
  private convertInlineKets(text: string): string {
    const parts: string[] = [];
    let lastIndex = 0;
    
    // Find all inline kets: |tag attrs>
    const ketRegex = /\|([a-zA-Z_][a-zA-Z0-9_-]*)\s*([^>]*?)>/g;
    let match;
    
    while ((match = ketRegex.exec(text)) !== null) {
      // Add text before this ket (escaped)
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        parts.push(this.escapeXml(beforeText));
      }
      
      // Add the converted ket (unescaped XML)
      const [, tag, attrs] = match;
      const attrStr = attrs.trim() ? ` ${this.convertAttributes(attrs.trim())}` : '';
      parts.push(`<${tag}${attrStr}/>`);
      
      lastIndex = ketRegex.lastIndex;
    }
    
    // Add remaining text after last ket (escaped)
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      parts.push(this.escapeXml(remainingText));
    }
    
    return parts.join('');
  }
}
