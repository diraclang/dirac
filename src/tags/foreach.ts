/**
 * <foreach> tag - iterate over XML elements
 * Usage: <foreach from="<available-subroutines />" as="sub">...</foreach>
 * or: <foreach from="$varname" as="item">...</foreach>
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { setVariable, getVariable, substituteVariables } from '../runtime/session.js';
import { integrateChildren } from '../runtime/interpreter.js';
import { XMLParser } from 'fast-xml-parser';

export async function executeForeach(session: DiracSession, element: DiracElement): Promise<void> {
  const fromAttr = element.attributes.from;
  const asVar = element.attributes.as || 'item';
  const xpath = element.attributes.xpath; // Optional: filter like "//subroutine"
  
  if (!fromAttr) {
    throw new Error('<foreach> requires "from" attribute');
  }
  
  // Get the XML content (either from variable or inline content)
  let xmlContent: string;
  
  if (fromAttr.startsWith('$')) {
    // Get from variable
    const varName = fromAttr.substring(1);
    xmlContent = getVariable(session, varName) || '';
  } else if (fromAttr.startsWith('<')) {
    // Evaluate the "from" attribute as inline XML (e.g., <available-subroutines />)
    const savedOutput = session.output;
    session.output = [];
    
    // Parse and execute the from content
    const { DiracParser } = await import('../runtime/parser.js');
    const parser = new DiracParser();
    try {
      const fromElement = parser.parse(fromAttr);
      const { integrate } = await import('../runtime/interpreter.js');
      await integrate(session, fromElement);
    } catch (e) {
      session.output = savedOutput;
      throw new Error(`Failed to evaluate from="${fromAttr}": ${e}`);
    }
    
    xmlContent = session.output.join('');
    session.output = savedOutput;
  } else {
    // Treat as literal XML string
    xmlContent = substituteVariables(session, fromAttr);
  }
  
  if (!xmlContent || xmlContent.trim() === '') {
    return; // Nothing to iterate over
  }
  
  // Parse the XML content
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
    preserveOrder: true,
  });
  
  let parsed;
  try {
    parsed = parser.parse(`<root>${xmlContent}</root>`);
  } catch (e) {
    throw new Error(`Failed to parse XML in <foreach>: ${e}`);
  }
  
  // Extract elements to iterate over
  const items = extractElements(parsed, xpath);
  
  // Iterate over each item
  for (const item of items) {
    // Store the item as a variable (as an object with tag, attributes, text)
    setVariable(session, asVar, item, false);
    
    // Execute the loop body
    await integrateChildren(session, element);
    
    if (session.isBreak) {
      session.isBreak = false;
      break;
    }
    
    if (session.isReturn) {
      break;
    }
  }
}

interface XmlItem {
  tag: string;
  attributes: Record<string, string>;
  text?: string;
}

function extractElements(parsed: any, xpath?: string): XmlItem[] {
  const items: XmlItem[] = [];
  
  // parsed is array with preserveOrder
  if (!Array.isArray(parsed)) {
    return items;
  }
  
  // Recursively extract all elements matching xpath
  const extractFromNode = (node: any) => {
    if (!node) return;
    
    const tagName = Object.keys(node).find(k => k !== ':@' && k !== '#text' && k !== '#comment');
    if (!tagName) return;
    
    const item: XmlItem = {
      tag: tagName,
      attributes: {},
    };
    
    // Extract attributes
    if (node[':@']) {
      for (const [key, value] of Object.entries(node[':@'])) {
        if (key.startsWith('@_')) {
          item.attributes[key.slice(2)] = value as string;
        }
      }
    }
    
    // Extract text content and recurse into children
    const children = node[tagName];
    if (Array.isArray(children)) {
      for (const child of children) {
        if (child['#text']) {
          item.text = (item.text || '') + child['#text'];
        } else {
          // Recurse into child elements
          extractFromNode(child);
        }
      }
    }
    
    // Add this item if it matches xpath
    if (!xpath || matchesXPath(item, xpath)) {
      items.push(item);
    }
  };
  
  // Start extraction from root
  for (const rootItem of parsed) {
    if (rootItem['root']) {
      const rootChildren = rootItem['root'];
      if (Array.isArray(rootChildren)) {
        for (const child of rootChildren) {
          extractFromNode(child);
        }
      }
    }
  }
  
  return items;
}

function matchesXPath(item: XmlItem, xpath: string): boolean {
  // Simple xpath matching - just tag name for now
  // Supports: "//tagname" or "tagname"
  const tagMatch = xpath.match(/\/{0,2}(\w+)/);
  if (tagMatch) {
    return item.tag === tagMatch[1];
  }
  return true;
}
