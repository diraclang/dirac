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

// Load shell configuration from config.yml and args
function loadShellConfig(args: string[] = []): any {
  const shellConfig: any = { debug: false };
  
  // Parse command-line options
  for (let i = 0; i < args.length; i++) {
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
          initScript: configData.initScript,
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
        shellConfig.initScript = shellConfig.initScript || configData.initScript;
      } catch (err) {
        // Ignore
      }
    }
  }
  
  return shellConfig;
}

async function main() {
  const args = process.argv.slice(2);

  // Check if launched as 'dish' command (auto-launch shell)
  const calledAs = process.argv[1];
  if (calledAs && calledAs.endsWith('/dish')) {
    const { DiracShell } = await import('./shell.js');
    const shellConfig = loadShellConfig(args);
    const shell = new DiracShell(shellConfig);
    await shell.start();
    return;
  }

  // --help option
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: dirac <file.di|file.bk>');
    console.log('       dirac shell [options]');
    console.log('       dish              Start interactive shell (short alias)');
    console.log('       dirac agent <command>');
    console.log('');
    console.log('Commands:');
    console.log('  shell             Start interactive shell (REPL)');
    console.log('  shell --agent     Connect shell to running agent daemon');
    console.log('  agent start       Start persistent agent daemon');
    console.log('  agent stop        Stop agent daemon');
    console.log('  agent status      Check agent status');
    console.log('  agent restart     Restart agent daemon');
    console.log('  agent logs        Show agent logs');
    console.log('  shell --daemon    Start shell with persistent daemon (experimental)');
    console.log('');
    console.log('Shell tips:');
    console.log('  Press Ctrl-Z to suspend shell, then `bg` to run in background');
    console.log('  Use `fg` to bring it back to foreground');
    console.log('  Cron jobs and run-at tasks continue running in background');
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

  // Check for agent command
  if (args[0] === 'agent') {
    const subcommand = args[1];
    
    // Special case: daemon subcommand runs the actual daemon
    if (subcommand === 'daemon') {
      const { runAgentDaemon } = await import('./agent.js');
      await runAgentDaemon();
      return;
    }
    
    // All other subcommands use AgentCLI
    const { AgentCLI } = await import('./agent.js');
    const agent = new AgentCLI();
    
    switch (subcommand) {
      case 'start':
        await agent.start();
        break;
      case 'stop':
        await agent.stop();
        break;
      case 'status':
        await agent.status();
        break;
      case 'restart':
        await agent.restart();
        break;
      case 'logs':
        const follow = args.includes('-f') || args.includes('--follow');
        await agent.logs(follow);
        break;
      default:
        console.error('Unknown agent command:', subcommand);
        console.error('Available commands: start, stop, status, restart, logs');
        process.exit(1);
    }
    
    return;
  }

  // Check for shell command
  if (args[0] === 'shell') {
    const { DiracShell } = await import('./shell.js');
    const { SessionServer, isSessionRunning, getSocketPath } = await import('./session-server.js');
    const { SessionClient } = await import('./session-client.js');
    
    // Check for --daemon and --agent flags
    const daemonMode = args.includes('--daemon') || args.includes('-d');
    const agentMode = args.includes('--agent') || args.includes('-a');
    
    // Load shell configuration (skip --daemon and --agent flags)
    const shellConfig = loadShellConfig(args.slice(1).filter(arg => 
      arg !== '--daemon' && arg !== '-d' && arg !== '--agent' && arg !== '-a'
    ));
    
    // Handle agent mode - connect to running agent
    if (agentMode) {
      if (!isSessionRunning()) {
        console.error('Error: No agent is running');
        console.error('Start the agent first with: dirac agent start');
        process.exit(1);
      }
      
      console.log('Connecting to agent...');
      const client = new SessionClient({ socketPath: getSocketPath() });
      
      client.on('error', (error) => {
        console.error('Agent error:', error);
      });
      
      try {
        await client.connect();
        console.log('Connected to agent at', getSocketPath());
        console.log('Session state is persistent across disconnects');
        console.log('');
        
        const shell = new DiracShell(shellConfig);
        shell.setClient(client);
        
        // Handle cleanup on exit
        process.on('SIGINT', async () => {
          await client.disconnect();
          process.exit(0);
        });
        
        // Start shell (this returns after setup, not after exit)
        await shell.start();
        
        // Shell will handle its own lifecycle
        // Don't disconnect here - shell is still running
      } catch (error) {
        console.error('Failed to connect to agent:', error);
        process.exit(1);
      }
      
      return;
    }
    
    // Handle daemon mode
    if (daemonMode) {
      console.log('Note: Daemon mode is under development.');
      console.log('For now, use Ctrl-Z + bg to background the shell.');
      console.log('');
      // TODO: Implement full daemon mode with client-server architecture
    }
    
    // Normal shell mode
    const shell = new DiracShell(shellConfig);
    await shell.start();
    return;
  }
  
  // Hidden command to start daemon directly (for future use)
  if (args[0] === 'daemon') {
    const { SessionServer } = await import('./session-server.js');
    const server = new SessionServer();
    
    await server.start();
    console.log('Session daemon started');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await server.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await server.shutdown();
      process.exit(0);
    });
    
    // Keep process alive
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
  
  // Check DEBUG environment variable
  if (process.env.DEBUG === '1') {
    config.debug = true;
  }

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
