#!/usr/bin/env node

/**
 * Dirac CLI
 */

import 'dotenv/config';
import pkg from '../package.json' assert { type: 'json' };
import fs from 'fs';
import yaml from 'js-yaml';
import { resolve, extname } from 'path';
import { execute } from './index.js';
import { BraKetParser } from './runtime/braket-parser.js';

async function main() {
  const args = process.argv.slice(2);

  // --help option
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: dirac <file.di|file.bk>');
    console.log('       dirac shell [options]');
    console.log('');
    console.log('Commands:');
    console.log('  shell             Start interactive shell (REPL)');
    console.log('');
    console.log('File formats:');
    console.log('  .di               XML notation (verbose)');
    console.log('  .bk               Bra-ket notation (compact)');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h        Show this help message');
    console.log('  --version, -v     Show version');
    console.log('  --debug           Enable debug output');
    console.log('  --emit-xml        Output intermediate XML (for .bk files)');
    console.log('  --model <name>    Set default LLM model');
    console.log('  --max-llm <n>     Maximum LLM calls (default: 100)');
    console.log('  --max-depth <n>   Maximum recursion depth (default: 50)');
    console.log('  -f, --config <path>  Path to config.yml file');
    process.exit(0);
  }

  // --version option
  if (args.includes('--version') || args.includes('-v')) {
    console.log(pkg.version);
    process.exit(0);
  }

  // Check for shell command
  if (args[0] === 'shell') {
    const { DiracShell } = await import('./shell.js');
    
    // Parse shell-specific options
    const shellConfig: any = { debug: false };
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--debug') {
        shellConfig.debug = true;
      } else if ((arg === '-f' || arg === '--config') && i + 1 < args.length) {
        const configPath = resolve(args[++i]);
        if (fs.existsSync(configPath)) {
          const configData = yaml.load(fs.readFileSync(configPath, 'utf-8')) as any;
          Object.assign(shellConfig, {
            llmProvider: configData.llmProvider,
            llmModel: configData.llmModel,
            customLLMUrl: configData.customLLMUrl,
          });
        }
      }
    }
    
    // Load from default config.yml if not specified
    if (!shellConfig.llmProvider) {
      const defaultConfigPath = resolve(process.cwd(), 'config.yml');
      if (fs.existsSync(defaultConfigPath)) {
        try {
          const configData = yaml.load(fs.readFileSync(defaultConfigPath, 'utf-8')) as any;
          shellConfig.llmProvider = shellConfig.llmProvider || configData.llmProvider;
          shellConfig.llmModel = shellConfig.llmModel || configData.llmModel;
          shellConfig.customLLMUrl = shellConfig.customLLMUrl || configData.customLLMUrl;
        } catch (err) {
          // Ignore
        }
      }
    }
    
    const shell = new DiracShell(shellConfig);
    shell.start();
    return;
  }

  if (args.length === 0) {
    console.error('Usage: dirac <file.di|file.bk>');
    console.error('       dirac shell [options]');
    console.error('Try dirac --help for more information.');
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

  // Load config from YAML file if specified, or use ./config.yml if present
  if (!configFile) {
    const defaultConfigPath = resolve(process.cwd(), 'config.yml');
    if (fs.existsSync(defaultConfigPath)) {
      configFile = defaultConfigPath;
    }
  }
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
