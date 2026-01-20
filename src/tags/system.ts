/**
 * <system> tag - Execute shell commands
 * Spawns a Unix process and runs the command
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { substituteVariables, emit } from '../runtime/session.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { integrate } from '../runtime/interpreter.js';

const execAsync = promisify(exec);

export async function executeSystem(session: DiracSession, element: DiracElement): Promise<void> {
  // Build command from text content or children
  let command: string;
  
  // Check if has non-text children (actual element children)
  const hasElementChildren = element.children.some(child => child.tag !== '');
  
  if (hasElementChildren) {
    // Execute children to build command dynamically
    const beforeOutput = session.output.length;
    
    for (const child of element.children) {
      await integrate(session, child);
    }
    
    // Collect output from children as the command
    const childOutput = session.output.slice(beforeOutput);
    command = childOutput.join('');
    
    // Remove child output from main output
    session.output = session.output.slice(0, beforeOutput);
  } else if (element.text) {
    // Simple text command with variable substitution
    command = substituteVariables(session, element.text);
  } else {
    throw new Error('<system> requires command content');
  }
  
  if (!command.trim()) {
    return;
  }
  
  if (session.debug) {
    console.error(`[SYSTEM] Executing: ${command}`);
  }
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    // Emit stdout
    if (stdout) {
      emit(session, stdout);
    }
    
    // Emit stderr if debug mode
    if (stderr && session.debug) {
      console.error(`[SYSTEM STDERR] ${stderr}`);
    }
    
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    throw new Error(`System command failed: ${errorMsg}`);
  }
}
