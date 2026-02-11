/**
 * <attr> tag - extract attribute value from XML item
 * Usage: <attr name="description" from="$sub" />
 * or: <attr name="param-format" from="$sub" />
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { getVariable, substituteVariables } from '../runtime/session.js';

export async function executeAttr(session: DiracSession, element: DiracElement): Promise<void> {
  const nameAttr = element.attributes.name;
  const fromAttr = element.attributes.from;
  
  if (!nameAttr) {
    throw new Error('<attr> requires "name" attribute');
  }
  
  if (!fromAttr) {
    throw new Error('<attr> requires "from" attribute');
  }
  
  // Get the XML item from variable
  let item: any;
  
  if (fromAttr.startsWith('$')) {
    const varName = fromAttr.substring(1);
    item = getVariable(session, varName);
  } else {
    // Try substitution
    const substituted = substituteVariables(session, fromAttr);
    item = getVariable(session, substituted);
  }
  
  if (!item) {
    // No output if item not found
    return;
  }
  
  // Extract the attribute value
  let value = '';
  
  if (typeof item === 'object') {
    // If it's a structured XML item (from foreach)
    if (item.attributes && typeof item.attributes === 'object') {
      value = item.attributes[nameAttr] || '';
    }
    // If it's a direct object with the attribute
    else if (item[nameAttr] !== undefined) {
      value = String(item[nameAttr]);
    }
  } else if (typeof item === 'string') {
    // If it's a string, try to parse as XML and extract
    value = extractAttrFromXml(item, nameAttr);
  }
  
  session.output.push(value);
}

function extractAttrFromXml(xml: string, attrName: string): string {
  // Simple regex-based extraction for single-element XML
  const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : '';
}
