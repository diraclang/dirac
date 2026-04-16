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
import type { SessionClient } from './session-client.js';

const HISTORY_FILE = path.join(os.homedir(), '.dirac_history');
const MAX_HISTORY = 1000;

export class DiracShell {
  private session: any;
  private client: SessionClient | null = null;
  private cachedSubroutines: any[] = [];  // Cache for agent mode tab completion
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
      completer: this.completer.bind(this),
    });

    this.loadHistory();
    this.setupHandlers();
  }

  /**
   * Set client for daemon mode
   */
  setClient(client: SessionClient): void {
    this.client = client;
    
    // Fetch and cache subroutines for tab completion
    this.updateCachedSubroutines();
  }
  
  /**
   * Update cached subroutines from agent
   */
  private async updateCachedSubroutines(): Promise<void> {
    if (!this.client) return;
    
    try {
      const state = await this.client.getState();
      this.cachedSubroutines = state.subroutines || [];
    } catch (error) {
      // Silently fail - tab completion will just not work
    }
  }

  private completer(line: string): [string[], string] {
    // Use cached subroutines if in agent mode, otherwise use session subroutines
    const subroutines = this.client ? this.cachedSubroutines : this.session.subroutines;
    
    // Check if user is typing a variable: $varname
    const varMatch = line.match(/\$([a-zA-Z0-9_-]*)$/);
    
    if (varMatch) {
      const partial = varMatch[1];
      
      // Get session variables
      const varNames = Object.keys(this.session.variables || {});
      
      // Get environment variables (common ones to reduce noise)
      const commonEnvVars = ['HOME', 'PATH', 'USER', 'SHELL', 'PWD', 'OLDPWD', 
                             'TERM', 'LANG', 'EDITOR', 'TMPDIR', 'PS1'];
      const envVarNames = Object.keys(process.env).filter(name => 
        commonEnvVars.includes(name) || name.startsWith('DIRAC_') || name.startsWith('TELEGRAM_')
      );
      
      // Combine and filter
      const allVars = [...varNames, ...envVarNames];
      const matches = allVars.filter(name => 
        name.toLowerCase().startsWith(partial.toLowerCase())
      );
      
      const completions = matches.map(name => `$${name}`);
      return [completions, varMatch[0]];
    }
    
    // Check if user is typing a file path (starts with ./ or ~/ or / or ../)
    const pathMatch = line.match(/((?:\.\.?\/|~\/|\/)[^\s]*)$/);
    
    if (pathMatch) {
      const partial = pathMatch[1];
      
      try {
        // Expand ~ to home directory
        let searchPath = partial;
        if (searchPath.startsWith('~/')) {
          searchPath = path.join(os.homedir(), searchPath.slice(2));
        }
        
        // Get directory and file prefix
        const dirPath = path.dirname(searchPath);
        const filePrefix = path.basename(searchPath);
        
        // Read directory contents
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
          const entries = fs.readdirSync(dirPath, { withFileTypes: true });
          
          // Filter by prefix
          const matches = entries
            .filter(entry => entry.name.startsWith(filePrefix))
            .map(entry => {
              const fullPath = path.join(dirPath, entry.name);
              // Convert back to original format (~ or ./ or /)
              let displayPath = fullPath;
              if (partial.startsWith('~/')) {
                displayPath = '~/' + path.relative(os.homedir(), fullPath);
              } else if (partial.startsWith('./') || partial.startsWith('../')) {
                displayPath = path.relative(process.cwd(), fullPath);
                if (!displayPath.startsWith('.')) {
                  displayPath = './' + displayPath;
                }
              }
              
              // Add trailing slash for directories
              return entry.isDirectory() ? displayPath + '/' : displayPath;
            });
          
          if (matches.length > 0) {
            return [matches, pathMatch[0]];
          }
        }
      } catch (error) {
        // Silently fail on file system errors
      }
    }
    
    // Check if user is typing an attribute after a tag: |tagname attr_partial
    // Match: |tagname something attr_partial (where attr_partial is being typed)
    const attrMatch = line.match(/\|([a-z0-9_-]+)\s+.*?([a-z0-9_-]*)$/i);
    
    if (attrMatch) {
      const tagName = attrMatch[1];
      const attrPartial = attrMatch[2];
      
      // Find the subroutine
      const subroutine = subroutines.find((sub: any) => sub.name === tagName);
      
      if (subroutine && subroutine.parameters && subroutine.parameters.length > 0) {
        // Filter by partial match
        const matches = subroutine.parameters.filter((p: any) => 
          p.name.toLowerCase().startsWith(attrPartial.toLowerCase())
        );
        
        // If multiple matches, show info as display-only (user can't complete to this text)
        // Print the detailed info and return just the parameter names for actual completion
        if (matches.length > 1) {
          console.log('\n');
          matches.forEach((p: any) => {
            const parts = [];
            if (p.type) parts.push(p.type);
            if (p.required) parts.push('required');
            if (p.description) parts.push(p.description);
            if (p.options && p.options.length > 0) parts.push(`[${p.options.join(',')}]`);
            if (p.examples && p.examples.length > 0) parts.push(`eg:${p.examples[0]}`);
            const info = parts.length > 0 ? ` (${parts.join(' | ')})` : '';
            console.log(`  ${p.name}=${info}`);
          });
        }
        
        // Return just the parameter names with '=' for actual completion
        const completions = matches.map((p: any) => `${p.name}=`);
        
        return [completions, attrPartial];
      }
    }
    
    // Check if user just completed a tag name: |tagname (suggest first space + attributes)
    const tagCompleteMatch = line.match(/\|([a-z0-9_-]+)$/i);
    
    if (tagCompleteMatch) {
      const tagName = tagCompleteMatch[1];
      
      // First try exact match to show attributes
      const subroutine = subroutines.find((sub: any) => sub.name === tagName);
      
      if (subroutine && subroutine.parameters && subroutine.parameters.length > 0) {
        // Print detailed parameter info above the prompt
        console.log('\n');
        subroutine.parameters.forEach((p: any) => {
          const parts = [];
          if (p.type) parts.push(p.type);
          if (p.required) parts.push('required');
          if (p.description) parts.push(p.description);
          if (p.options && p.options.length > 0) parts.push(`[${p.options.join(',')}]`);
          if (p.examples && p.examples.length > 0) parts.push(`eg:${p.examples[0]}`);
          const info = parts.length > 0 ? ` (${parts.join(' | ')})` : '';
          console.log(`  ${p.name}=${info}`);
        });
        
        // Return just the parameter names with '=' for actual completion
        const paramSuggestions = subroutine.parameters.map((p: any) => `${p.name}=`);
        
        return [paramSuggestions, ''];
      }
      
      // Otherwise, show matching subroutine names
      const subroutineNames = subroutines.map((sub: any) => sub.name);
      const matches = subroutineNames.filter((name: string) => 
        name.toLowerCase().startsWith(tagName.toLowerCase())
      );
      
      if (matches.length > 0) {
        // For each match, check if it has parameters
        const completions = matches.map((name: string) => {
          const sub = subroutines.find((s: any) => s.name === name);
          const hasParams = sub && sub.parameters && sub.parameters.length > 0;
          
          // If has parameters, leave it open with a space; otherwise close with >
          return hasParams ? `|${name} ` : `|${name}>`;
        });
        return [completions, tagCompleteMatch[0]];
      }
    }
    
    // Check if user is typing a bra-ket tag: |name>
    const braketMatch = line.match(/\|([a-z0-9_-]*)$/i);
    
    if (braketMatch) {
      const partial = braketMatch[1];
      
      // Get all subroutine names
      const subroutineNames = this.session.subroutines.map((sub: any) => sub.name);
      
      // Filter matches
      const matches = subroutineNames.filter((name: string) => 
        name.toLowerCase().startsWith(partial.toLowerCase())
      );
      
      // For each match, check if it has parameters
      const completions = matches.map((name: string) => {
        const subroutine = this.session.subroutines.find((sub: any) => sub.name === name);
        const hasParams = subroutine && subroutine.parameters && subroutine.parameters.length > 0;
        
        // If has parameters, leave it open with a space; otherwise close with >
        return hasParams ? `|${name} ` : `|${name}>`;
      });
      
      return [completions, braketMatch[0]];
    }
    
    // Check if user is typing a shell command: :name
    const commandMatch = line.match(/:([a-z]*)$/i);
    
    if (commandMatch) {
      const partial = commandMatch[1];
      const commands = ['help', 'quit', 'exit', 'vars', 'subs', 'clear', 'history', 'save', 'debug', 'llm', 'index'];
      
      const matches = commands.filter(cmd => cmd.startsWith(partial.toLowerCase()));
      const completions = matches.map(cmd => `:${cmd}`);
      
      return [completions, commandMatch[0]];
    }
    
    // Check if line starts with system tag and complete common shell commands
    if (line.includes('<system>') || line.includes('|system>')) {
      // Extract the partial command after the system tag
      const systemMatch = line.match(/(?:<system>|\\|system>)\s*([a-z]*)$/i);
      
      if (systemMatch) {
        const partial = systemMatch[1];
        const commonCommands = [
          'ls', 'cd', 'pwd', 'cat', 'grep', 'find', 'echo', 'cp', 'mv', 'rm', 'mkdir', 'touch',
          'git', 'npm', 'node', 'python', 'curl', 'wget', 'ssh', 'scp', 'tar', 'gzip', 'diff',
          'ps', 'top', 'kill', 'chmod', 'chown', 'ln', 'du', 'df', 'which', 'man', 'history'
        ];
        
        const matches = commonCommands.filter(cmd => cmd.startsWith(partial.toLowerCase()));
        
        if (matches.length > 0) {
          return [matches, partial];
        }
      }
    }
    
    return [[], line];
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

  private checkUnsavedSubroutines(): void {
    // Find subroutines that either:
    // 1. Have no sourcePath (created in session)
    // 2. Have sourcePath but are from multi-subroutine files (would create new file on save)
    // 3. Have sourcePath in temp directory (from edit-subroutine)
    const unsaved: any[] = [];
    const excludePaths = [
      path.join(os.homedir(), '.dirac', 'lib'),  // System library
      '/tmp/',  // Temp files
    ];
    
    for (const sub of this.session.subroutines) {
      // Skip if meta-hide-from-llm (internal/system subroutines)
      if (sub.meta && sub.meta['hide-from-llm'] === 'true') {
        continue;
      }
      
      if (!sub.sourcePath) {
        // No source file - definitely unsaved
        unsaved.push({ name: sub.name, reason: 'created in session' });
      } else {
        // Check if it's from a system/excluded path
        const isExcluded = excludePaths.some(excludePath => 
          sub.sourcePath.startsWith(excludePath)
        );
        
        if (isExcluded) {
          continue;  // Skip system/temp subroutines
        }
        
        if (fs.existsSync(sub.sourcePath)) {
          // Has source file - check if it contains multiple subroutines
          try {
            const content = fs.readFileSync(sub.sourcePath, 'utf-8');
            const parser = new DiracParser();
            const ast = parser.parse(content);
            const count = this.countSubroutinesInAST(ast);
            
            if (count > 1) {
              // Multi-subroutine file - saving would create new file
              const shortPath = sub.sourcePath.replace(os.homedir(), '~');
              unsaved.push({ name: sub.name, reason: `from multi-sub file (${shortPath})` });
            }
          } catch (err) {
            // Parse error - skip to avoid false positives
          }
        }
      }
    }
    
    if (unsaved.length > 0) {
      console.log('\n⚠️  Warning: You have unsaved subroutines:');
      for (const { name, reason } of unsaved) {
        console.log(`   - ${name} (${reason})`);
      }
      console.log('\nUse :save <name> or |save-subroutine name="..."> to persist them.\n');
    }
  }

  private countSubroutinesInAST(element: any): number {
    let count = 0;
    
    if (element.tag === 'subroutine') {
      count = 1;
    }
    
    if (element.children) {
      for (const child of element.children) {
        count += this.countSubroutinesInAST(child);
      }
    }
    
    return count;
  }

  private setupHandlers(): void {
    this.rl.on('line', async (input: string) => {
      await this.handleInput(input);
    });

    this.rl.on('close', () => {
      // Check for unsaved subroutines before exiting
      this.checkUnsavedSubroutines();
      
      this.saveHistory();
      
      // Disconnect from agent if connected
      if (this.client) {
        this.client.disconnect();
      }
      
      // Stop all scheduled tasks on exit
      import('./tags/schedule.js').then(({ stopAllScheduledTasks }) => {
        stopAllScheduledTasks();
        console.log('\nGoodbye!');
        process.exit(0);
      }).catch(() => {
        console.log('\nGoodbye!');
        process.exit(0);
      });
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

    // Simple shorthand: ? -> |ai>
    if (this.inputBuffer.length === 0 && input.trim().startsWith('?')) {
      const rest = input.trim().substring(1).trim();
      input = rest ? `|ai>${rest}` : `|ai>`;
      if (this.config.debug) {
        console.log(`[mapped: ? -> ${input}]`);
      }
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
      // If connected to agent, execute remotely
      if (this.client) {
        // Parse bra-ket to XML
        const xml = this.braketParser.parse(input);
        
        if (this.config.debug) {
          console.log('[Debug] Sending to agent:\n', xml);
        }
        
        // Execute on agent (returns output as string)
        const output = await this.client.execute(xml);
        
        if (output) {
          console.log(output);
        }
        
        // Update cached subroutines for tab completion
        await this.updateCachedSubroutines();
        
        return;
      }
      
      // Otherwise execute locally
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
  :reload         Reload config.yml and reinitialize LLM
  :index <path>   Index subroutines from directory
  :search <query> Search indexed subroutines
  :load <query>   Load context (search and import subroutines)
  :save <name> [file]  Save subroutine (default: ~/.dirac/lib/TIMESTAMP/name.di)
  :stats          Show registry statistics
  :tasks          List all scheduled tasks
  :stop <name>    Stop a scheduled task
  :stopall        Stop all scheduled tasks
  :crons          List all cron jobs
  :stopcron <name> Stop a cron job
  :stopallcrons   Stop all cron jobs
  :scheduled      List all scheduled runs (run-at)
  :cancel <name>  Cancel a scheduled run
  :cancelall      Cancel all scheduled runs
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
        try {
          let variables;
          if (this.client) {
            const state = await this.client.getState();
            variables = state.variables || [];
          } else {
            variables = this.session.variables;
          }
          
          if (variables.length === 0) {
            console.log('No variables defined');
          } else {
            console.log('Variables:');
            for (const v of variables) {
              if (v.visible) {
                console.log(`  ${v.name} = ${JSON.stringify(v.value)}`);
              }
            }
          }
        } catch (error) {
          console.error('Error getting variables:', error instanceof Error ? error.message : String(error));
        }
        break;

      case 'subs':
        try {
          let subroutines;
          if (this.client) {
            const state = await this.client.getState();
            console.log('State received:', JSON.stringify(state, null, 2).substring(0, 500));
            subroutines = state.subroutines || [];
          } else {
            subroutines = this.session.subroutines;
          }
          
          if (!Array.isArray(subroutines)) {
            console.error('Error: subroutines is not an array, it is:', typeof subroutines);
            break;
          }
          
          if (subroutines.length === 0) {
            console.log('No subroutines defined');
          } else {
            console.log('Subroutines:');
            for (const s of subroutines) {
              const params = s.parameters?.map((p: any) => p.name).join(', ') || '';
              console.log(`  ${s.name}(${params})`);
              if (s.description) {
                console.log(`    ${s.description}`);
              }
            }
          }
        } catch (error) {
          console.error('Error getting subroutines:', error instanceof Error ? error.message : String(error));
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
        
      case 'reload':
        try {
          await this.reloadConfig();
          console.log('Configuration reloaded successfully');
          console.log(`  LLM Provider: ${this.config.llmProvider || 'none'}`);
          console.log(`  LLM Model: ${this.config.llmModel || 'default'}`);
          if (this.config.customLLMUrl) {
            console.log(`  Custom LLM URL: ${this.config.customLLMUrl}`);
          }
        } catch (error) {
          console.error('Error reloading config:', error instanceof Error ? error.message : String(error));
        }
        break;
        
      case 'index':
        if (args.length === 0) {
          console.log('Usage: :index <path>');
        } else {
          const indexPath = args[0];
          try {
            const xml = `<index-subroutines path="${indexPath}" />`;
            const ast = this.xmlParser.parse(xml);
            await integrate(this.session, ast);
            if (this.session.output.length > 0) {
              console.log(this.session.output.join(''));
            }
          } catch (error) {
            console.error('Error indexing:', error instanceof Error ? error.message : String(error));
          }
        }
        break;
        
      case 'search':
        if (args.length === 0) {
          console.log('Usage: :search <query>');
        } else {
          const query = args.join(' ');
          try {
            const xml = `<search-subroutines query="${query}" format="text" />`;
            const ast = this.xmlParser.parse(xml);
            await integrate(this.session, ast);
            if (this.session.output.length > 0) {
              console.log(this.session.output.join(''));
            }
          } catch (error) {
            console.error('Error searching:', error instanceof Error ? error.message : String(error));
          }
        }
        break;
        
      case 'load':
        if (args.length === 0) {
          console.log('Usage: :load <query>');
        } else {
          const query = args.join(' ');
          try {
            const xml = `<load-context query="${query}" limit="5" import="true" />`;
            const ast = this.xmlParser.parse(xml);
            await integrate(this.session, ast);
            if (this.session.output.length > 0) {
              console.log(this.session.output.join(''));
            }
          } catch (error) {
            console.error('Error loading context:', error instanceof Error ? error.message : String(error));
          }
        }
        break;
        
      case 'save':
        if (args.length === 0) {
          console.log('Usage: :save <subroutine-name> [file]');
          console.log('  If file is omitted, saves to ~/.dirac/lib/TIMESTAMP/NAME.di');
          console.log('Examples:');
          console.log('  :save greet                    # saves to ~/.dirac/lib/TIMESTAMP/greet.di');
          console.log('  :save greet ./my-lib/greet.di  # saves to specific file');
          console.log('  :save greet utils              # saves to ~/.dirac/lib/utils/greet.di');
        } else {
          const subName = args[0];
          const fileName = args.length > 1 ? args[1] : undefined;
          try {
            let xml: string;
            if (fileName) {
              // Check if it's a directory path or file path
              if (fileName.includes('/') || fileName.includes('.di')) {
                xml = `<save-subroutine name="${subName}" file="${fileName}" format="xml" />`;
              } else {
                // Treat as directory name under ~/.dirac/lib/
                xml = `<save-subroutine name="${subName}" path="${fileName}" format="xml" />`;
              }
            } else {
              // No file specified, use default timestamped directory
              xml = `<save-subroutine name="${subName}" format="xml" />`;
            }
            const ast = this.xmlParser.parse(xml);
            await integrate(this.session, ast);
            if (this.session.output.length > 0) {
              console.log(this.session.output.join(''));
            }
          } catch (error) {
            console.error('Error saving subroutine:', error instanceof Error ? error.message : String(error));
          }
        }
        break;
        
      case 'stats':
        try {
          const xml = '<registry-stats />';
          const ast = this.xmlParser.parse(xml);
          await integrate(this.session, ast);
          if (this.session.output.length > 0) {
            console.log(this.session.output.join(''));
          }
        } catch (error) {
          console.error('Error getting stats:', error instanceof Error ? error.message : String(error));
        }
        break;
        
      case 'tasks':
        try {
          const { listScheduledTasks } = await import('./tags/schedule.js');
          const tasks = listScheduledTasks();
          if (tasks.length === 0) {
            console.log('No scheduled tasks running.');
          } else {
            console.log('\nScheduled Tasks:');
            for (const task of tasks) {
              console.log(`  - ${task.name}: every ${task.interval}s`);
            }
          }
        } catch (error) {
          console.error('Error listing tasks:', error instanceof Error ? error.message : String(error));
        }
        break;
        
      case 'stop':
        if (args.length === 0) {
          console.log('Usage: :stop <task-name>');
        } else {
          try {
            const { stopScheduledTask } = await import('./tags/schedule.js');
            const taskName = args[0];
            const stopped = stopScheduledTask(taskName);
            if (stopped) {
              console.log(`Stopped task: ${taskName}`);
            } else {
              console.log(`Task not found: ${taskName}`);
            }
          } catch (error) {
            console.error('Error stopping task:', error instanceof Error ? error.message : String(error));
          }
        }
        break;
        
      case 'stopall':
        try {
          const { stopAllScheduledTasks } = await import('./tags/schedule.js');
          stopAllScheduledTasks();
          console.log('All scheduled tasks stopped.');
        } catch (error) {
          console.error('Error stopping tasks:', error instanceof Error ? error.message : String(error));
        }
        break;
        
      case 'crons':
        try {
          const { listCronJobs } = await import('./tags/cron.js');
          const jobs = listCronJobs();
          if (jobs.length === 0) {
            console.log('No cron jobs running.');
          } else {
            console.log('\nCron Jobs:');
            for (const job of jobs) {
              const status = job.isRunning ? '(running)' : '';
              console.log(`  - ${job.name}: ${job.cronExpression} ${status}`);
            }
          }
        } catch (error) {
          console.error('Error listing cron jobs:', error instanceof Error ? error.message : String(error));
        }
        break;
        
      case 'stopcron':
        if (args.length === 0) {
          console.log('Usage: :stopcron <job-name>');
        } else {
          try {
            const { stopCronJob } = await import('./tags/cron.js');
            const jobName = args[0];
            const stopped = stopCronJob(jobName);
            if (stopped) {
              console.log(`Stopped cron job: ${jobName}`);
            } else {
              console.log(`Cron job not found: ${jobName}`);
            }
          } catch (error) {
            console.error('Error stopping cron job:', error instanceof Error ? error.message : String(error));
          }
        }
        break;
        
      case 'stopallcrons':
        try {
          const { stopAllCronJobs } = await import('./tags/cron.js');
          stopAllCronJobs();
          console.log('All cron jobs stopped.');
        } catch (error) {
          console.error('Error stopping cron jobs:', error instanceof Error ? error.message : String(error));
        }
        break;
        
      case 'scheduled':
        try {
          const { listScheduledRuns } = await import('./tags/run-at.js');
          const runs = listScheduledRuns();
          if (runs.length === 0) {
            console.log('No scheduled runs pending.');
          } else {
            console.log('\nScheduled Runs:');
            for (const run of runs) {
              const status = run.isRunning ? '(running)' : '';
              console.log(`  - ${run.name}: ${run.scheduledTime.toLocaleString()} ${status}`);
            }
          }
        } catch (error) {
          console.error('Error listing scheduled runs:', error instanceof Error ? error.message : String(error));
        }
        break;
        
      case 'cancel':
        if (args.length === 0) {
          console.log('Usage: :cancel <run-name>');
        } else {
          try {
            const { cancelScheduledRun } = await import('./tags/run-at.js');
            const runName = args[0];
            const cancelled = cancelScheduledRun(runName);
            if (cancelled) {
              console.log(`Cancelled scheduled run: ${runName}`);
            } else {
              console.log(`Scheduled run not found: ${runName}`);
            }
          } catch (error) {
            console.error('Error cancelling run:', error instanceof Error ? error.message : String(error));
          }
        }
        break;
        
      case 'cancelall':
        try {
          const { cancelAllScheduledRuns } = await import('./tags/run-at.js');
          cancelAllScheduledRuns();
          console.log('All scheduled runs cancelled.');
        } catch (error) {
          console.error('Error cancelling runs:', error instanceof Error ? error.message : String(error));
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
   * If command is not found, fallback to treating it as an AI query
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
    
    return new Promise(async (resolve) => {
      // Use the user's shell (or fallback to sh)
      const shell = process.env.SHELL || '/bin/sh';
      
      // Capture stderr to detect "command not found" errors
      const child = spawn(shell, ['-c', command], {
        stdio: ['inherit', 'inherit', 'pipe'],
        cwd: process.cwd(),
      });
      
      let stderrData = '';
      child.stderr?.on('data', (data) => {
        stderrData += data.toString();
        // Also show the error to user in real-time
        process.stderr.write(data);
      });
      
      child.on('close', async (code) => {
        // Resume readline after command completes
        this.rl.resume();
        
        // Check if command was not found (exit code 127 is standard for command not found)
        // Also check stderr for "command not found" message
        const commandNotFound = code === 127 || stderrData.includes('command not found');
        
        if (commandNotFound) {
          // Notify user about fallback
          console.log(`💡 Command not found, trying as AI query...`);
          
          // Fallback to AI query
          if (this.config.debug) {
            console.log(`[executing: |ai>${trimmed}]`);
          }
          
          // Execute as AI query
          const aiInput = `|ai>${trimmed}`;
          this.inputBuffer = [aiInput];
          await this.executeBuffer();
        }
        
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
      
      // If connected to agent, execute there; otherwise local
      if (this.client) {
        const xml = this.braketParser.parse(scriptContent);
        await this.client.execute(xml);
      } else {
        // Parse and execute locally
        const xml = this.braketParser.parse(scriptContent);
        const ast = this.xmlParser.parse(xml);
        await integrate(this.session, ast);
      }
      
      console.log(`Init script loaded.\n`);
    } catch (err) {
      console.error(`Error loading init script: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }

  /**
   * Reload configuration from config.yml
   */
  private async reloadConfig(): Promise<void> {
    const configPath = path.resolve(process.cwd(), 'config.yml');
    
    if (!fs.existsSync(configPath)) {
      throw new Error('config.yml not found in current directory');
    }
    
    const configData = yaml.load(fs.readFileSync(configPath, 'utf-8')) as any;
    
    // Update config
    this.config.llmProvider = configData.llmProvider || process.env.LLM_PROVIDER;
    this.config.llmModel = configData.llmModel || process.env.LLM_MODEL;
    this.config.customLLMUrl = configData.customLLMUrl || process.env.CUSTOM_LLM_URL;
    
    // Reinitialize the session with new config (keeps variables/subroutines but updates LLM client)
    const oldVariables = this.session.variables;
    const oldSubroutines = this.session.subroutines;
    const oldImportedFiles = this.session.importedFiles;
    
    this.session = createSession(this.config);
    this.session.variables = oldVariables;
    this.session.subroutines = oldSubroutines;
    this.session.importedFiles = oldImportedFiles;
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
