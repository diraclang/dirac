#!/usr/bin/env node

/**
 * Dirac CLI
 */

import 'dotenv/config';
import fs from 'fs';
import yaml from 'js-yaml';
import { resolve, extname } from 'path';
import { execute } from './index.js';
import { BraKetParser } from './runtime/braket-parser.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: dirac <file.di|file.bk>');
    console.error('');
    console.error('File formats:');
    console.error('  .di               XML notation (verbose)');
    console.error('  .bk               Bra-ket notation (compact)');
    console.error('');
    console.error('Options:');
    console.error('  --debug           Enable debug output');
    console.error('  --emit-xml        Output intermediate XML (for .bk files)');
    console.error('  --model <name>    Set default LLM model');
    console.error('  --max-llm <n>     Maximum LLM calls (default: 100)');
    console.error('  --max-depth <n>   Maximum recursion depth (default: 50)');
    process.exit(1);
  }
  
  // Parse options
  const config: any = {};
  let filePath: string | undefined;
  let emitXml = false;
  let configFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--debug') {
      config.debug = true;
    } else if (arg === '--emit-xml') {
      emitXml = true;
    } else if (arg === '--model' && i + 1 < args.length) {
      config.model = args[++i];
    } else if (arg === '--provider' && i + 1 < args.length) {
      config.llmProvider = args[++i];
    } else if ((arg === '-f' || arg === '--config') && i + 1 < args.length) {
      configFile = args[++i];
    } else if (arg === '--max-llm' && i + 1 < args.length) {
      config.maxLLMCalls = parseInt(args[++i], 10);
    } else if (arg === '--max-depth' && i + 1 < args.length) {
      config.maxDepth = parseInt(args[++i], 10);
    } else if (!arg.startsWith('--')) {
      filePath = arg;
    }
  }

  // Load config from YAML file if specified
  if (configFile) {
    try {
      const loadedConfig = yaml.load(fs.readFileSync(resolve(configFile), 'utf8')) || {};
      Object.assign(config, loadedConfig);
    } catch (err) {
      console.error('Failed to load config file:', err);
      process.exit(1);
    }
  }
  
  if (!filePath) {
    console.error('Error: No input file specified');
    process.exit(1);
  }
  
  try {
    const fullPath = resolve(process.cwd(), filePath);
    let source = fs.readFileSync(fullPath, 'utf-8');
    const ext = extname(fullPath);
    
    // Convert bra-ket notation to XML if needed
    if (ext === '.bk') {
      if (config.debug) {
        console.error(`[Dirac] Compiling bra-ket notation to XML`);
      }
      
      const braketParser = new BraKetParser();
      const xml = braketParser.parse(source);
      
      if (emitXml) {
        console.log(xml);
        return;
      }
      
      source = xml;
    }
    
    if (config.debug) {
      console.error(`[Dirac] Executing ${fullPath}`);
    }
    
    // Pass file path to config for import resolution
    config.filePath = fullPath;
    
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
