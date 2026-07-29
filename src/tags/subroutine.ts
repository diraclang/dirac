/**
 * <subroutine> tag - define reusable code block
 * Maps to mask_tag_subroutine in MASK
 */

import type { DiracSession, DiracElement, ParameterMetadata } from '../types/index.js';
import { registerSubroutine } from '../runtime/session.js';

export function executeSubroutine(session: DiracSession, element: DiracElement): void {
  // Skip registration if we're in extend mode (nested subroutines already registered)
  if (session.skipSubroutineRegistration) {
    return;
  }
  
  const name = element.attributes.name;
  
  if (!name) {
    throw new Error('<subroutine> requires name attribute');
  }
  
  // Extract metadata from attributes (no structural changes!)
  const description = element.attributes.description;
  const visible = element.attributes.visible === 'subroutine' || element.attributes.visible === 'both';
  const parameters: ParameterMetadata[] = [];
  const meta: Record<string, any> = {};

  // Parse param- prefixed attributes for metadata
  function parseMetaField(metaString: string) {
    const parts = metaString.split(':');
    return {
      type: parts[0] || 'string',
      required: parts[1] === 'required',
      description: parts[2] || undefined,
      example: parts[3] || undefined
    };
  }
  for (const [attrName, attrValue] of Object.entries(element.attributes)) {
    if (attrName.startsWith('param-')) {
      const paramName = attrName.substring(6);
      const parts = attrValue.split(':');
      const paramMeta: ParameterMetadata = {
        name: paramName,
        type: parts[0] || 'string',
        required: parts[1] === 'required',
        description: parts[2] || undefined,
      };
      if (parts.length > 3 && parts[3]) {
        paramMeta.enum = parts[3].split('|');
      }
      if (parts.length > 4 && parts[4]) {
        paramMeta.example = parts[4];
      }
      parameters.push(paramMeta);
    } else if (attrName.startsWith('meta-')) {
      const metaName = attrName.substring(5);
      meta[metaName] = parseMetaField(attrValue);
    }
  }
  
  // Store subroutine with deep-cloned children to prevent mutation
  // This ensures nested subroutines don't get their children consumed during execution
  const subroutine: DiracElement = {
    tag: 'subroutine',
    attributes: { ...element.attributes },
    children: deepCloneChildren(element.children),
  };
  
  // Pass meta as a field in the subroutine registry, not on the element
  // Also pass currentFile as sourcePath to track where subroutine came from
  registerSubroutine(
    session,
    name,
    subroutine,
    description,
    parameters.length > 0 ? parameters : undefined,
    Object.keys(meta).length > 0 ? meta : undefined,
    visible,
    session.currentFile
  );
}

/**
 * Deep clone children array to prevent mutation
 */
function deepCloneChildren(children: any[]): any[] {
  if (!children) return children;
  return children.map(child => {
    if (!child.tag) {
      // Text node
      return { ...child };
    }
    // Element node
    return {
      ...child,
      attributes: child.attributes ? { ...child.attributes } : undefined,
      children: child.children ? deepCloneChildren(child.children) : undefined,
    };
  });
}
