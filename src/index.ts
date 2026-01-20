/**
 * Main entry point for Dirac interpreter
 */

export { DiracParser } from './runtime/parser.js';
export { createSession, getOutput } from './runtime/session.js';
export { integrate } from './runtime/interpreter.js';
export type { DiracSession, DiracConfig, DiracElement } from './types/index.js';

import { DiracParser } from './runtime/parser.js';
import { createSession, getOutput } from './runtime/session.js';
import { integrate } from './runtime/interpreter.js';
import type { DiracConfig } from './types/index.js';

/**
 * Execute Dirac source code
 */
export async function execute(source: string, config: DiracConfig = {}): Promise<string> {
  const parser = new DiracParser();
  const session = createSession(config);
  
  // Set current file if provided in config
  if (config.filePath) {
    session.currentFile = config.filePath;
  }
  
  const ast = parser.parse(source);
  await integrate(session, ast);
  
  return getOutput(session);
}
