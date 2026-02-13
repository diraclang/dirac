/**
 * <input> tag - read from stdin or file
 * Usage: 
 *   <input source="stdin" mode="all" />
 *   <input source="stdin" mode="line" />
 *   <input source="file" path="file.txt" mode="all" />
 *   <input source="file" path="file.txt" mode="line" />
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit, substituteAttribute } from '../runtime/session.js';
import * as fs from 'fs';
import * as readline from 'readline';

// Store file readers for line-by-line reading
const fileReaders = new Map<string, readline.Interface>();
const fileIterators = new Map<string, AsyncIterator<string>>();

export async function executeInput(session: DiracSession, element: DiracElement): Promise<void> {
  const source = element.attributes.source;
  const mode = element.attributes.mode || 'all';
  const pathAttr = element.attributes.path;

  if (!source) {
    throw new Error('<input> requires source attribute (stdin or file)');
  }

  if (source === 'file' && !pathAttr) {
    throw new Error('<input source="file"> requires path attribute');
  }

  let value = '';

  if (source === 'stdin') {
    if (mode === 'all') {
      // Read all stdin at once
      value = await readAllStdin();
    } else if (mode === 'line') {
      // Read one line from stdin
      value = await readLineStdin();
    } else {
      throw new Error(`<input> invalid mode: ${mode}. Use 'all' or 'line'`);
    }
  } else if (source === 'file') {
    const path = substituteAttribute(session, pathAttr);
    
    if (mode === 'all') {
      // Read entire file
      value = fs.readFileSync(path, 'utf-8');
    } else if (mode === 'line') {
      // Read one line from file
      value = await readLineFromFile(path);
    } else {
      throw new Error(`<input> invalid mode: ${mode}. Use 'all' or 'line'`);
    }
  } else {
    throw new Error(`<input> invalid source: ${source}. Use 'stdin' or 'file'`);
  }

  // Emit the value to output
  emit(session, value);
}

/**
 * Read all stdin content at once
 */
async function readAllStdin(): Promise<string> {
  // Remove any existing listeners to avoid conflicts
  process.stdin.removeAllListeners('data');
  process.stdin.removeAllListeners('end');
  process.stdin.removeAllListeners('error');
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    const onData = (chunk: Buffer) => {
      chunks.push(chunk);
    };
    
    const onEnd = () => {
      const result = Buffer.concat(chunks).toString('utf-8');
      
      // Clean up listeners
      process.stdin.removeListener('data', onData);
      process.stdin.removeListener('end', onEnd);
      process.stdin.removeListener('error', onError);
      
      resolve(result);
    };
    
    const onError = (err: Error) => {
      // Clean up listeners
      process.stdin.removeListener('data', onData);
      process.stdin.removeListener('end', onEnd);
      process.stdin.removeListener('error', onError);
      
      reject(err);
    };
    
    process.stdin.on('data', onData);
    process.stdin.on('end', onEnd);
    process.stdin.on('error', onError);
    
    process.stdin.resume();
  });
}

/**
 * Read one line from stdin
 */
let stdinReader: readline.Interface | null = null;
let stdinIterator: AsyncIterator<string> | null = null;

async function readLineStdin(): Promise<string> {
  if (!stdinReader) {
    stdinReader = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    stdinIterator = stdinReader[Symbol.asyncIterator]();
  }

  const result = await stdinIterator!.next();
  
  if (result.done) {
    // EOF reached, close reader
    stdinReader.close();
    stdinReader = null;
    stdinIterator = null;
    return '';
  }
  
  return result.value;
}

/**
 * Read one line from a file
 */
async function readLineFromFile(path: string): Promise<string> {
  // Create reader if it doesn't exist for this file
  if (!fileReaders.has(path)) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    fileReaders.set(path, rl);
    fileIterators.set(path, rl[Symbol.asyncIterator]());
  }

  const iterator = fileIterators.get(path)!;
  const result = await iterator.next();
  
  if (result.done) {
    // EOF reached, close and cleanup
    const reader = fileReaders.get(path)!;
    reader.close();
    fileReaders.delete(path);
    fileIterators.delete(path);
    return '';
  }
  
  return result.value;
}

/**
 * Clean up all open file readers (can be called at end of session)
 */
export function cleanupInputReaders(): void {
  if (stdinReader) {
    stdinReader.close();
    stdinReader = null;
    stdinIterator = null;
  }
  
  for (const reader of fileReaders.values()) {
    reader.close();
  }
  fileReaders.clear();
  fileIterators.clear();
}
