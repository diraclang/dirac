/**
 * <subroutine> tag - define reusable code block
 * Maps to mask_tag_subroutine in MASK
 */

import type { DiracSession, DiracElement, ParameterMetadata } from '../types/index.js';
import { registerSubroutine, substituteVariables, substituteAttribute } from '../runtime/session.js';
import { normalizeSubroutineDefinition } from '../utils/subroutine-parameters.js';

export function executeSubroutine(session: DiracSession, element: DiracElement): void {
  // Skip registration if we're in extend mode (nested subroutines already registered)
  if (session.skipSubroutineRegistration) {
    return;
  }
  
  const nameAttr = element.attributes.name;
  
  if (!nameAttr) {
    throw new Error('<subroutine> requires name attribute');
  }
  
  // Substitute variables in the name attribute to support dynamic naming
  const name = substituteAttribute(session, nameAttr);
  
  const normalized = normalizeSubroutineDefinition(element);

  // Extract metadata from attributes (declaration-only parameter blocks are normalized away)
  const description = normalized.attributes.description;
  const visible = normalized.attributes.visible === 'subroutine' || normalized.attributes.visible === 'both';
  const parameters: ParameterMetadata[] = normalized.parameters;
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
  for (const [attrName, attrValue] of Object.entries(normalized.attributes)) {
    if (attrName.startsWith('meta-')) {
      const metaName = attrName.substring(5);
      meta[metaName] = parseMetaField(attrValue);
    }
  }
  
  // Store subroutine with deep-cloned children to prevent mutation
  // This ensures nested subroutines don't get their children consumed during execution
  const subroutine: DiracElement = {
    tag: 'subroutine',
    attributes: { ...normalized.attributes, name }, // Use substituted name
    children: deepCloneChildren(normalized.children),
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
