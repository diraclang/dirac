#!/usr/bin/env node

/**
 * Dirac CLI
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { execute } from './index.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: dirac <file.di>');
    console.error('');
    console.error('Options:');
    console.error('  --debug           Enable debug output');
    console.error('  --model <name>    Set default LLM model');
    console.error('  --max-llm <n>     Maximum LLM calls (default: 100)');
    console.error('  --max-depth <n>   Maximum recursion depth (default: 50)');
    process.exit(1);
  }
  
  // Parse options
  const config: any = {};
  let filePath: string | undefined;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--debug') {
      config.debug = true;
    } else if (arg === '--model' && i + 1 < args.length) {
      config.model = args[++i];
    } else if (arg === '--max-llm' && i + 1 < args.length) {
      config.maxLLMCalls = parseInt(args[++i], 10);
    } else if (arg === '--max-depth' && i + 1 < args.length) {
      config.maxDepth = parseInt(args[++i], 10);
    } else if (!arg.startsWith('--')) {
      filePath = arg;
    }
  }
  
  if (!filePath) {
    console.error('Error: No input file specified');
    process.exit(1);
  }
  
  try {
    const fullPath = resolve(process.cwd(), filePath);
    const source = readFileSync(fullPath, 'utf-8');
    
    if (config.debug) {
      console.error(`[Dirac] Executing ${fullPath}`);
    }
    
    const result = await execute(source, config);
    process.stdout.write(result);
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    if (config.debug && error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
