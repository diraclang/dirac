/**
 * <output> tag - emit content
 * Maps to mask_tag_output in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit, substituteVariables, substituteAttribute, setOutputBoundary, popAndCaptureOutput } from '../runtime/session.js';
import { integrateChildren } from '../runtime/interpreter.js';
import * as fs from 'fs';
import * as path from 'path';

export async function executeOutput(session: DiracSession, element: DiracElement): Promise<void> {
  const fileAttr = element.attributes?.file;
  const modeAttr = element.attributes?.mode; // 'append' (default) or 'overwrite'
  const filePath = fileAttr ? substituteAttribute(session, fileAttr) : null;
  
  // If writing to a file, collect content first
  if (filePath) {
    let content = '';
    
    if (element.children && element.children.length > 0) {
      // Capture output from children
      const oldBoundary = setOutputBoundary(session);
      await integrateChildren(session, element);
      content = popAndCaptureOutput(session);
      session.outputBoundary = oldBoundary;
    } else if (element.text) {
      content = substituteVariables(session, element.text);
    }
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (dir !== '.' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write to file based on mode
    const mode = modeAttr || 'append';
    if (mode === 'overwrite') {
      fs.writeFileSync(filePath, content + '\n', 'utf8');
      if (session.debug) {
        console.error(`[OUTPUT] Wrote (overwrite) to ${filePath}: ${content.substring(0, 50)}...`);
      }
    } else {
      // Default: append mode
      fs.appendFileSync(filePath, content + '\n', 'utf8');
      if (session.debug) {
        console.error(`[OUTPUT] Appended to ${filePath}: ${content.substring(0, 50)}...`);
      }
    }
    return;
  }
  
  // Normal output to stdout
  if (element.children && element.children.length > 0) {
    await integrateChildren(session, element);
    return;
  }
  
  if (element.text) {
    const content = substituteVariables(session, element.text);
    emit(session, content);
    return;
  }
}
