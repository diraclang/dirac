/**
 * <subroutine> tag - define reusable code block
 * Maps to mask_tag_subroutine in MASK
 */

import type { DiracSession, DiracElement, ParameterMetadata } from '../types/index.js';
import { registerSubroutine } from '../runtime/session.js';

export function executeSubroutine(session: DiracSession, element: DiracElement): void {
  const name = element.attributes.name;
  
  if (!name) {
    throw new Error('<subroutine> requires name attribute');
  }
  
  // Extract metadata from attributes (no structural changes!)
  const description = element.attributes.description;
  const parameters: ParameterMetadata[] = [];
  
  // Parse param- prefixed attributes for metadata
  // e.g., param-color="string:required:Color name:red|blue|green"
  for (const [attrName, attrValue] of Object.entries(element.attributes)) {
    if (attrName.startsWith('param-')) {
      const paramName = attrName.substring(6); // Remove "param-" prefix
      
      // Parse format: "type:required:description:enum1|enum2|..."
      const parts = attrValue.split(':');
      const paramMeta: ParameterMetadata = {
        name: paramName,
        type: parts[0] || 'string',
        required: parts[1] === 'required',
        description: parts[2] || undefined,
      };
      
      // Parse enum if present (after 3rd colon)
      if (parts[3]) {
        paramMeta.enum = parts[3].split('|');
      }
      
      parameters.push(paramMeta);
    }
  }
  
  // Store subroutine exactly as before (preserves nesting and extends)
  const subroutine: DiracElement = {
    tag: 'subroutine',
    attributes: { ...element.attributes },
    children: element.children,
  };
  
  registerSubroutine(session, name, subroutine, description, parameters.length > 0 ? parameters : undefined);
}
