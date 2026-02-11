/**
 * <output> tag - emit content
 * Maps to mask_tag_output in MASK
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit, substituteVariables, substituteAttribute } from '../runtime/session.js';
import { integrateChildren } from '../runtime/interpreter.js';
import * as fs from 'fs';
import * as path from 'path';

export async function executeOutput(session: DiracSession, element: DiracElement): Promise<void> {
  const fileAttr = element.attributes?.file;
  const filePath = fileAttr ? substituteAttribute(session, fileAttr) : null;
  
  // If writing to a file, collect content first
  if (filePath) {
    let content = '';
    
    if (element.children && element.children.length > 0) {
      // Capture output from children
      const prevOutput = session.output;
      session.output = [];
      await integrateChildren(session, element);
      content = session.output.join('');
      session.output = prevOutput;
    } else if (element.text) {
      content = substituteVariables(session, element.text);
    }
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (dir !== '.' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Append to file
    fs.appendFileSync(filePath, content + '\n', 'utf8');
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
