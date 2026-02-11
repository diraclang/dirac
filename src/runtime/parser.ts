/**
 * XML Parser for Dirac (.di files)
 */

import { XMLParser } from 'fast-xml-parser';
import type { DiracElement } from '../types/index.js';

export class DiracParser {
  private parser: XMLParser;
  
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      trimValues: false,  // Preserve whitespace in mixed content
      parseAttributeValue: false,
      parseTagValue: false,
      textNodeName: '#text',
      cdataPropName: '#cdata',
      preserveOrder: true,  // Preserve element order!
      commentPropName: '#comment',
    });
  }
  
  parse(source: string): DiracElement {
    // Strip shebang line if present
    if (source.startsWith('#!')) {
      source = source.replace(/^#!.*\n/, '');
    }
    
    // Always wrap in DIRAC-ROOT to ensure valid XML with single root
    // This allows files with comments, multiple elements, or no root
    source = `<DIRAC-ROOT>\n${source}\n</DIRAC-ROOT>`;
    
    const result = this.parser.parse(source);
    // With preserveOrder, result is an array
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Empty or invalid XML');
    }
    
    // Find the first non-comment element
    for (const item of result) {
      if (!item['#comment']) {
        return this.convertOrderedToElement(item);
      }
    }
    
    throw new Error('No root element found');
  }
  
  private convertOrderedToElement(obj: any): DiracElement {
    // obj is like { "tagname": [...children], ":@": {...attributes} }
    const tagName = Object.keys(obj).find(k => k !== ':@' && k !== '#comment');
    
    if (!tagName) {
      throw new Error('Invalid element structure');
    }
    
    const element: DiracElement = {
      tag: tagName,
      attributes: {},
      children: [],
    };
    
    // Extract attributes
    if (obj[':@']) {
      for (const [key, value] of Object.entries(obj[':@'])) {
        if (key.startsWith('@_')) {
          element.attributes[key.slice(2)] = value as string;
        }
      }
    }
    
    // Extract children
    const children = obj[tagName];
    if (Array.isArray(children)) {
      for (const child of children) {
        if (child['#text']) {
          // Text node - add as child AND to element.text for backward compat
          element.children.push({
            tag: '',
            text: child['#text'],
            attributes: {},
            children: []
          });
          // Also set element.text if not set (for simple text-only elements)
          if (!element.text) {
            element.text = child['#text'];
          } else {
            element.text += child['#text'];
          }
        } else if (child['#comment']) {
          // Skip comments
          continue;
        } else {
          // Child element
          element.children.push(this.convertOrderedToElement(child));
        }
      }
    }
    
    return element;
  }
  
  // Old method - no longer used
  private convertToElement(obj: any, tagName?: string): DiracElement {
    if (!tagName) {
      // Root level - find the actual tag
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        throw new Error('Empty XML');
      }
      tagName = keys[0];
      obj = obj[tagName];
    }
    
    const element: DiracElement = {
      tag: tagName,
      attributes: {},
      children: [],
    };
    
    if (typeof obj === 'string') {
      element.text = obj;
      return element;
    }
    
    if (!obj) {
      return element;
    }
    
    // Extract attributes and children
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      
      if (key === '#text') {
        element.text = value;
      } else if (key.startsWith('@_')) {
        // Attribute
        element.attributes[key.slice(2)] = value;
      } else {
        // Child element
        if (Array.isArray(value)) {
          for (const item of value) {
            element.children.push(this.convertToElement(item, key));
          }
        } else {
          element.children.push(this.convertToElement(value, key));
        }
      }
    }
    
    return element;
  }
}
