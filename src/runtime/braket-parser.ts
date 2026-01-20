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
        const attrs = line.attrs ? ` ${this.convertAttributes(line.attrs)}` : '';
        output.push(`${'  '.repeat(line.indent)}<subroutine name="${line.tag}"${attrs}>`);
        this.currentLine++;
        this.parseBlock(output, line.indent);
        output.push(`${'  '.repeat(line.indent)}</subroutine>`);
        continue;
      }

      // Ket: |tag attrs>
      if (line.type === 'ket') {
        const indent = '  '.repeat(line.indent);
        const attrs = line.attrs ? ` ${this.convertAttributes(line.attrs)}` : '';
        
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
   * Convert inline kets within text content
   * Example: "Hello |variable name=x> world" → "Hello <variable name="x"/> world"
   */
  private convertInlineKets(text: string): string {
    return text.replace(/\|([a-zA-Z_][a-zA-Z0-9_-]*)\s*([^>]*?)>/g, (match, tag, attrs) => {
      const attrStr = attrs.trim() ? ` ${this.convertAttributes(attrs.trim())}` : '';
      return `<${tag}${attrStr}/>`;
    });
  }
}
