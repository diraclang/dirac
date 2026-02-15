/**
 * <break> tag - exit current loop or foreach iteration
 * Sets session.isBreak flag which is checked by loop and foreach tags
 * 
 * Usage: 
 *   <loop>
 *     <test-if test="$condition"><break /></test-if>
 *   </loop>
 */

import type { DiracSession, DiracElement } from '../types/index.js';

export async function executeBreak(session: DiracSession, element: DiracElement): Promise<void> {
  session.isBreak = true;
}
