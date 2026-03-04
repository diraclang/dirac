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

    // Check if we're in multi-line mode
    const indent = this.getIndent(input);
    
    if (this.inputBuffer.length === 0) {
      // First line
      this.inputBuffer.push(input);
      this.baseIndent = indent;
      
      // Check if this looks like it needs continuation
      if (this.needsContinuation(input)) {
        this.rl.setPrompt('... ');
        console.log('    (Press Enter on empty line to execute, or Ctrl+C to cancel)');
        this.rl.prompt();
        return;
      }
    } else {
      // Continuation line
      if (input.trim() === '') {
        // Empty line ends multi-line input
        await this.executeBuffer();
        this.rl.setPrompt('> ');
        this.rl.prompt();
        return;
      }
      
      // Continue accumulating
      this.inputBuffer.push(input);
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
  - Shell switches to '...' prompt
  - Type your content lines (add spaces for indentation manually)
  - Press ENTER on an empty line to execute
  - Or press Ctrl+C to cancel
  
Note: You must manually add spaces for indentation (2 spaces per level)

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

  start(): void {
    console.log('Dirac Shell v0.1.0');
    console.log('Type :help for commands, :exit to quit\n');
    
    if (this.config.llmProvider) {
      console.log(`LLM: ${this.config.llmProvider} (${this.config.llmModel || 'default'})\n`);
    } else {
      console.log('Warning: No LLM provider configured. Set LLM_PROVIDER environment variable.\n');
    }
    
    this.rl.prompt();
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
  shell.start();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
