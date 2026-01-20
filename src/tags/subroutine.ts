/**
 * <subroutine> tag - define reusable code block
 * Maps to mask_tag_subroutine in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { registerSubroutine } from '../runtime/session.js';

export function executeSubroutine(session: DiracSession, element: DiracElement): void {
  const name = element.attributes.name;
  
  if (!name) {
    throw new Error('<subroutine> requires name attribute');
  }
  
  // Store subroutine (including extends if present)
  const subroutine: DiracElement = {
    tag: 'subroutine',
    attributes: { ...element.attributes },
    children: element.children,
  };
  
  registerSubroutine(session, name, subroutine);
}
