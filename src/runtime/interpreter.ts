/**
 * Core interpreter - maps to mask_integrate in MASK
 */

import type { DiracElement, DiracSession } from '../types/index.js';
import { substituteVariables, emit } from './session.js';
import { executeDefvar } from '../tags/defvar.js';
import { executeAssign } from '../tags/assign.js';
import { executeOutput } from '../tags/output.js';
import { executeSubroutine } from '../tags/subroutine.js';
import { executeCall } from '../tags/call.js';
import { executeLoop } from '../tags/loop.js';
import { executeIf } from '../tags/if.js';
import { executeLLM } from '../tags/llm.js';
import { executeEval } from '../tags/eval.js';
import { executeExecute } from '../tags/execute.js';

export async function integrate(session: DiracSession, element: DiracElement): Promise<void> {
  // Check execution limits
  if (session.limits.currentDepth >= session.limits.maxDepth) {
    throw new Error('Maximum execution depth exceeded');
  }
  
  session.limits.currentDepth++;
  
  try {
    // Handle text nodes
    if (element.text && !element.tag) {
      const substituted = substituteVariables(session, element.text);
      emit(session, substituted);
      return;
    }
    
    // Check control flow
    if (session.isReturn || session.isBreak) {
      return;
    }
    
    // Dispatch to tag handlers
    switch (element.tag.toLowerCase()) {
      case 'defvar':
        executeDefvar(session, element);
        break;
        
      case 'assign':
        executeAssign(session, element);
        break;
        
      case 'output':
        await executeOutput(session, element);
        break;
        
      case 'subroutine':
        executeSubroutine(session, element);
        break;
        
      case 'call':
        await executeCall(session, element);
        break;
        
      case 'loop':
        await executeLoop(session, element);
        break;
        
      case 'if':
        await executeIf(session, element);
        break;
        
      case 'llm':
        await executeLLM(session, element);
        break;
        
      case 'eval':
        await executeEval(session, element);
        break;
        
      case 'execute':
        await executeExecute(session, element);
        break;
        
      default:
        // Unknown tag - just process children
        for (const child of element.children) {
          await integrate(session, child);
          if (session.isReturn || session.isBreak) break;
        }
    }
  } finally {
    session.limits.currentDepth--;
  }
}

export async function integrateChildren(session: DiracSession, element: DiracElement): Promise<void> {
  for (const child of element.children) {
    await integrate(session, child);
    if (session.isReturn || session.isBreak) break;
  }
}
