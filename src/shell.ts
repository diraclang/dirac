#!/usr/bin/env node
/**
 * Dirac Shell - Interactive REPL for Dirac
 * 
 * Supports:
 * - Bra-ket notation (|tag> and <tag|)
 * - Multi-line input with indentation
 * - Persistent session (variables, subroutines, LLM context)
 * - History
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BraKetParser } from './runtime/braket-parser.js';
import { DiracParser } from './runtime/parser.js';
import { createSession } from './runtime/session.js';
import { integrate } from './runtime/interpreter.js';
import yaml from 'js-yaml';
import type { DiracConfig } from './types/index.js';

const HISTORY_FILE = path.join(os.homedir(), '.dirac_history');
const MAX_HISTORY = 1000;

export class DiracShell {
  private session: any;
  private braketParser: BraKetParser;
  private xmlParser: DiracParser;
  private rl: readline.Interface;
  private inputBuffer: string[] = [];
  private baseIndent: number | null = null;
  private currentIndent: number = 0;
  private config: DiracConfig;

  constructor(config: DiracConfig = {}) {
    this.config = config;
    this.session = createSession(config);
    this.braketParser = new BraKetParser();
    this.xmlParser = new DiracParser();
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
      historySize: MAX_HISTORY,
    });

    this.loadHistory();
    this.setupHandlers();
  }

  private loadHistory(): void {
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        const history = fs.readFileSync(HISTORY_FILE, 'utf-8')
          .split('\n')
          .filter(line => line.trim())
          .slice(-MAX_HISTORY);
        
        // @ts-ignore - history is private but we need to set it
        this.rl.history = history.reverse();
      }
    } catch (err) {
      // Ignore history load errors
    }
  }

  private saveHistory(): void {
    try {
      // @ts-ignore
      const history = this.rl.history.slice().reverse().join('\n');
      fs.writeFileSync(HISTORY_FILE, history, 'utf-8');
    } catch (err) {
      // Ignore history save errors
    }
  }

  private setupHandlers(): void {
    this.rl.on('line', async (input: string) => {
      await this.handleInput(input);
    });

    this.rl.on('close', () => {
      this.saveHistory();
      console.log('\nGoodbye!');
      process.exit(0);
    });

    // Handle Ctrl+C
    this.rl.on('SIGINT', () => {
      if (this.inputBuffer.length > 0) {
        // Cancel multi-line input
        this.inputBuffer = [];
        this.baseIndent = null;
        this.currentIndent = 0;
        console.log('\n(Input cancelled)');
        this.rl.setPrompt('> ');
        this.rl.prompt();
      } else {
        this.rl.close();
      }
    });
  }

  private async handleInput(input: string): Promise<void> {
    // Special commands
    if (!this.inputBuffer.length && input.trim().startsWith(':')) {
      await this.handleCommand(input.trim());
      this.rl.prompt();
      return;
    }

    // Check if this is Dirac syntax or Unix shell command (only on first line)
    if (this.inputBuffer.length === 0 && !this.isDiracSyntax(input)) {
      // Pass to Unix shell
      await this.executeShellCommand(input);
      this.rl.prompt();
      return;
    }

    // Check if we're in multi-line mode
    const indent = this.getIndent(input);
    
    if (this.inputBuffer.length === 0) {
      // First line
      this.inputBuffer.push(input);
      this.baseIndent = indent;
      
      // Check if this looks like it needs continuation
      if (this.needsContinuation(input)) {
        // Set indentation for next line (2 spaces deeper)
        this.currentIndent = (this.baseIndent || 0) + 2;
        this.rl.setPrompt('... ');
        console.log(`    (Indent with ${this.currentIndent} spaces, or press Enter on empty line to execute)`);
        this.rl.prompt();
        return;
      }
    } else {
      // Continuation line
      if (input.trim() === '') {
        // Empty line ends multi-line input
        await this.executeBuffer();
        this.currentIndent = 0;
        this.rl.setPrompt('> ');
        this.rl.prompt();
        return;
      }
      
      // Prepend the current indentation to the input if it doesn't already have it
      let processedInput = input;
      if (this.currentIndent > 0 && indent < this.currentIndent) {
        // User didn't add the expected indentation, add it for them
        processedInput = ' '.repeat(this.currentIndent) + input;
      }
      
      // Continue accumulating
      this.inputBuffer.push(processedInput);
      
      // Calculate next indent level based on what user typed
      const trimmed = input.trim();
      const currentLineIndent = this.getIndent(processedInput);
      
      // Check if this line opens a new block
      if (trimmed.match(/^<[a-zA-Z_][a-zA-Z0-9_-]*.*\|$/) || 
          (trimmed.match(/^\|[a-zA-Z_][a-zA-Z0-9_-]*\s*[^>]*?>$/) && !trimmed.match(/>\s*.+$/))) {
        // Increase indent for next line
        this.currentIndent = currentLineIndent + 2;
      } else {
        // Keep same indent
        this.currentIndent = currentLineIndent;
      }
      
      this.rl.setPrompt('... ');
      this.rl.prompt();
      return;
    }

    // Execute single-line input
    await this.executeBuffer();
    this.rl.prompt();
  }

  private getIndent(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  private needsContinuation(line: string): boolean {
    const trimmed = line.trim();
    
    // Bra syntax always needs continuation
    if (trimmed.match(/^<[a-zA-Z_][a-zA-Z0-9_-]*.*\|$/)) {
      return true;
    }
    
    // Ket without inline content might need continuation
    const ketMatch = trimmed.match(/^\|([a-zA-Z_][a-zA-Z0-9_-]*)\s*([^>]*?)>\s*(.*)$/);
    if (ketMatch && !ketMatch[3]) {
      return true; // No inline content, probably has children
    }
    
    return false;
  }

  private async executeBuffer(): Promise<void> {
    if (this.inputBuffer.length === 0) return;

    const input = this.inputBuffer.join('\n');
    this.inputBuffer = [];
    this.baseIndent = null;

    try {
      // Clear previous output
      this.session.output = [];
      
      // Parse bra-ket to XML
      const xml = this.braketParser.parse(input);
      
      if (this.config.debug) {
        console.log('[Debug] Generated XML:\n', xml);
      }
      
      // Parse XML to AST
      const ast = this.xmlParser.parse(xml);
      
      // Execute
      await integrate(this.session, ast);
      
      // Display output
      if (this.session.output.length > 0) {
        console.log(this.session.output.join(''));
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      if (this.config.debug && error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }
  }

  private async handleCommand(cmd: string): Promise<void> {
    const parts = cmd.slice(1).split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        console.log(`
Dirac Shell - Interactive REPL

Commands:
  :help           Show this help
  :vars           List all variables
  :subs           List all subroutines
  :clear          Clear session (reset variables and subroutines)
  :debug          Toggle debug mode
  :config         Show current configuration
  :exit           Exit shell

Syntax:
  |tag attrs>text         Ket notation (most tags)
  <name|                  Bra notation (subroutine definitions)
    |output>content       Indented children
  
Multi-line Input:
  - Type a line that needs continuation (like <greeting| or |llm>)
  - Shell switches to '...' prompt and shows expected indent level
  - You can type spaces manually, or just type content (shell adds spaces)
  - Press ENTER on an empty line to execute
  - Or press Ctrl+C to cancel

Examples:
  |output>Hello World
  |defvar name=count value=5>
  |llm>create a greeting subroutine
  <greeting| name=String
    |output>Hello |variable name=name>
  |greeting name=World>
`);
        break;

      case 'vars':
        if (this.session.variables.length === 0) {
          console.log('No variables defined');
        } else {
          console.log('Variables:');
          for (const v of this.session.variables) {
            if (v.visible) {
              console.log(`  ${v.name} = ${JSON.stringify(v.value)}`);
            }
          }
        }
        break;

      case 'subs':
        if (this.session.subroutines.length === 0) {
          console.log('No subroutines defined');
        } else {
          console.log('Subroutines:');
          for (const s of this.session.subroutines) {
            const params = s.parameters?.map((p: any) => p.name).join(', ') || '';
            console.log(`  ${s.name}(${params})`);
            if (s.description) {
              console.log(`    ${s.description}`);
            }
          }
        }
        break;

      case 'clear':
        this.session.variables = [];
        this.session.subroutines = [];
        this.session.varBoundary = 0;
        this.session.subBoundary = 0;
        console.log('Session cleared');
        break;

      case 'debug':
        this.config.debug = !this.config.debug;
        this.session.debug = this.config.debug;
        console.log(`Debug mode: ${this.config.debug ? 'ON' : 'OFF'}`);
        break;

      case 'config':
        console.log('Configuration:');
        console.log(`  LLM Provider: ${this.config.llmProvider || 'none'}`);
        console.log(`  LLM Model: ${this.config.llmModel || 'default'}`);
        console.log(`  Debug: ${this.config.debug ? 'ON' : 'OFF'}`);
        if (this.config.customLLMUrl) {
          console.log(`  Custom LLM URL: ${this.config.customLLMUrl}`);
        }
        break;

      case 'exit':
      case 'quit':
        this.rl.close();
        break;

      default:
        console.log(`Unknown command: ${command}. Type :help for available commands.`);
    }
  }

  /**
   * Check if input contains Dirac bra-ket syntax
   * Must be careful not to match shell redirects (>, <, <<, >>)
   */
  private isDiracSyntax(input: string): boolean {
    const trimmed = input.trim();
    
    // Check for bra syntax: <name| (must have | at the end)
    // This won't match: < file.txt, ls < input.txt
    if (trimmed.match(/^<[a-zA-Z_][a-zA-Z0-9_-]*[^<>]*\|$/)) {
      return true;
    }
    
    // Check for ket syntax: |name> (must start with |)
    // This won't match: cat file.txt | grep foo
    if (trimmed.match(/^\|[a-zA-Z_][a-zA-Z0-9_-]*[^|]*>/)) {
      return true;
    }
    
    // Check for closing tags: </name>
    if (trimmed.match(/^<\/[a-zA-Z_][a-zA-Z0-9_-]*>$/)) {
      return true;
    }
    
    // Check for common Dirac XML tags if they appear at start
    if (trimmed.match(/^<(output|variable|defvar|llm|call|subroutine|if|foreach|test-if)\b/)) {
      return true;
    }
    
    return false;
  }

  /**
   * Execute a Unix shell command
   */
  private async executeShellCommand(command: string): Promise<void> {
    const trimmed = command.trim();
    
    // Handle 'cd' specially since it needs to change the Node.js process's cwd
    const cdMatch = trimmed.match(/^cd\s+(.*)$/);
    if (cdMatch) {
      const targetDir = cdMatch[1].trim() || process.env.HOME || '~';
      
      try {
        // Expand ~ to home directory
        const expandedDir = targetDir.startsWith('~') 
          ? targetDir.replace(/^~/, process.env.HOME || '~')
          : targetDir;
        
        process.chdir(expandedDir);
      } catch (err: any) {
        console.error(`cd: ${err.message}`);
      }
      return;
    }
    
    const { spawn } = await import('child_process');
    
    // Pause readline to allow interactive programs (vi, nano, etc.) to take control
    this.rl.pause();
    
    return new Promise((resolve) => {
      // Use the user's shell (or fallback to sh)
      const shell = process.env.SHELL || '/bin/sh';
      const child = spawn(shell, ['-c', command], {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      
      child.on('close', () => {
        // Resume readline after command completes
        this.rl.resume();
        resolve();
      });
      
      child.on('error', (err) => {
        console.error(`Shell error: ${err.message}`);
        this.rl.resume();
        resolve();
      });
    });
  }

  async start(): Promise<void> {
    console.log('Dirac Shell v0.1.0');
    console.log('Type :help for commands, :exit to quit\n');
    
    if (this.config.llmProvider) {
      console.log(`LLM: ${this.config.llmProvider} (${this.config.llmModel || 'default'})\n`);
    } else {
      console.log('Warning: No LLM provider configured. Set LLM_PROVIDER environment variable.\n');
    }
    
    // Run init script if configured
    if (this.config.initScript) {
      await this.runInitScript(this.config.initScript);
    }
    
    this.rl.prompt();
  }

  private async runInitScript(scriptPath: string): Promise<void> {
    try {
      // Resolve path relative to cwd
      const resolvedPath = path.isAbsolute(scriptPath) 
        ? scriptPath 
        : path.join(process.cwd(), scriptPath);
      
      if (!fs.existsSync(resolvedPath)) {
        console.log(`Init script not found: ${scriptPath}\n`);
        return;
      }
      
      console.log(`Loading init script: ${scriptPath}`);
      const scriptContent = fs.readFileSync(resolvedPath, 'utf-8');
      
      // Parse and execute the script
      const xml = this.braketParser.parse(scriptContent);
      const ast = this.xmlParser.parse(xml);
      await integrate(this.session, ast);
      
      console.log(`Init script loaded.\n`);
    } catch (err) {
      console.error(`Error loading init script: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }
}

// CLI entry point
async function main() {
  // Load config from config.yml if it exists
  let config: DiracConfig = {
    debug: process.env.DEBUG === '1',
  };

  const configPath = path.join(process.cwd(), 'config.yml');
  if (fs.existsSync(configPath)) {
    try {
      const configData = yaml.load(fs.readFileSync(configPath, 'utf-8')) as any;
      config = {
        ...config,
        llmProvider: configData.llmProvider || process.env.LLM_PROVIDER,
        llmModel: configData.llmModel || process.env.LLM_MODEL,
        customLLMUrl: configData.customLLMUrl || process.env.CUSTOM_LLM_URL,
        initScript: configData.initScript,
      };
    } catch (err) {
      console.error('Warning: Could not load config.yml');
    }
  } else {
    // Use environment variables
    config.llmProvider = process.env.LLM_PROVIDER;
    config.llmModel = process.env.LLM_MODEL;
    config.customLLMUrl = process.env.CUSTOM_LLM_URL;
  }

  const shell = new DiracShell(config);
  await shell.start();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
