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

  private getUnsavedSubroutines(): string[] {
    // Check subroutines created in session OR modified but not saved
    const unsaved: string[] = [];
    const excludePaths = [
      path.join(os.homedir(), '.dirac', 'lib'),  // System library
      '/tmp/',  // Temp files
    ];
    
    for (const sub of this.session.subroutines) {
      // Skip if meta-hide-from-llm (internal/system subroutines)
      if (sub.meta && sub.meta['hide-from-llm'] === 'true') {
        continue;
      }
      
      // Check if modified but not saved
      if (sub.modified) {
        unsaved.push(sub.name);
        continue;
      }
      
      if (!sub.sourcePath) {
        // No source file - created in session
        unsaved.push(sub.name);
      } else {
        // Check if it's from a system/excluded path
        const isExcluded = excludePaths.some(excludePath => 
          sub.sourcePath!.startsWith(excludePath)
        );
        
        if (isExcluded) {
          continue;  // Skip system/temp subroutines
        }
      }
    }
    
    return unsaved;
  }

  private async promptSaveUnsaved(unsaved: string[]): Promise<boolean> {
    console.log('\n⚠️  Warning: You have unsaved subroutines created in this session:');
    for (const name of unsaved) {
      console.log(`   - ${name}`);
    }
    console.log('\nOptions:');
    console.log('  a - Save all and exit');
    console.log('  n - Exit without saving');
    console.log('  c - Cancel (return to shell)');
    
    return new Promise((resolve) => {
      const confirmRl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      confirmRl.question('\nYour choice [a/n/c]: ', async (answer) => {
        confirmRl.close();
        const choice = answer.trim().toLowerCase();
        
        if (choice === 'a') {
          // Save all unsaved subroutines
          console.log('\nSaving all unsaved subroutines...\n');
          for (const name of unsaved) {
            try {
              const xml = `<save-subroutine name="${name}" format="xml" />`;
              const ast = this.xmlParser.parse(xml);
              await integrate(this.session, ast);
              if (this.session.output.length > 0) {
                console.log(this.session.output.join(''));
                this.session.output = [];
              }
            } catch (error) {
              console.error(`Error saving ${name}:`, error instanceof Error ? error.message : String(error));
            }
          }
          resolve(true);  // Proceed with exit
        } else if (choice === 'n') {
          resolve(true);  // Proceed with exit without saving
        } else {
          console.log('\n(Exit canceled - returning to shell)\n');
          resolve(false);  // Cancel exit
        }
      });
    });
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

  private finalizeExit(): void {
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
  }

  private setupHandlers(): void {
    this.rl.on('line', async (input: string) => {
      await this.handleInput(input);
    });

    this.rl.on('close', async () => {
      // Check for unsaved subroutines before exiting
      const unsaved = this.getUnsavedSubroutines();
      
      if (unsaved.length > 0) {
        const shouldExit = await this.promptSaveUnsaved(unsaved);
        if (shouldExit) {
          this.finalizeExit();
        } else {
          // User canceled - restart the shell
          this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> ',
            historySize: MAX_HISTORY,
            completer: this.completer.bind(this),
          });
          this.setupHandlers();
          this.rl.prompt();
        }
      } else {
        this.finalizeExit();
      }
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
      
      // Display raw LLM response if execution produced no visible output
      const silentExecution = this.session.variables.find(v => v.name === '__llm_silent_execution__');
      if (silentExecution?.value) {
        console.error(`\n[LLM generated]\n${silentExecution.value}\n`);
        // Clear the flag
        const idx = this.session.variables.findIndex(v => v.name === '__llm_silent_execution__');
        if (idx !== -1) this.session.variables.splice(idx, 1);
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
  :save-training [mode=full|pruned|both]  Save LLM dialog as training data (opens in editor)
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
                // Pretty-print JSON values for better readability
                let formattedValue;
                if (typeof v.value === 'object' && v.value !== null) {
                  // Value is already an object/array, format it directly
                  formattedValue = JSON.stringify(v.value, null, 2);
                } else if (typeof v.value === 'string' && 
                  (v.value.startsWith('[') || v.value.startsWith('{'))) {
                  // Value is a JSON string, parse and format it
                  try {
                    formattedValue = JSON.stringify(JSON.parse(v.value), null, 2);
                  } catch {
                    // If parsing fails, just use the string as-is
                    formattedValue = JSON.stringify(v.value);
                  }
                } else {
                  // Simple value, just stringify it
                  formattedValue = JSON.stringify(v.value);
                }
                console.log(`  ${v.name} =`);
                console.log(formattedValue.split('\n').map(line => `    ${line}`).join('\n'));
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

      case 'save-training':
        try {
          // Use the full cmd string to preserve arguments
          const fullCommand = cmd.slice(1); // Remove leading ':'
          const saveArgs = fullCommand.split(/\s+/).slice(1); // Skip 'save-training'
          let saveMode = 'full'; // 'full', 'pruned', 'both'
          
          console.error(`[DEBUG] Full command: "${fullCommand}"`);
          console.error(`[DEBUG] Args:`, saveArgs);
          
          for (const arg of saveArgs) {
            if (arg.startsWith('mode=')) {
              saveMode = arg.split('=')[1];
              console.error(`[DEBUG] Set mode to: ${saveMode}`);
            } else if (arg === 'prune=true') {
              saveMode = 'pruned';
              console.error(`[DEBUG] Set mode to pruned`);
            }
          }
          
          console.error(`[DEBUG] Final saveMode: ${saveMode}`);
          
          const dialogVar = this.client 
            ? (await this.client.getState()).variables.find((v: any) => v.name === '__llm_dialog__')
            : this.session.variables.find((v: any) => v.name === '__llm_dialog__');
          
          if (!dialogVar || !dialogVar.value) {
            console.log('No LLM dialog to save');
            break;
          }
          
          // Parse the dialog (it's stored as JSON string)
          const dialog = typeof dialogVar.value === 'string' 
            ? JSON.parse(dialogVar.value)
            : dialogVar.value;
          
          if (!Array.isArray(dialog) || dialog.length === 0) {
            console.log('Dialog is empty');
            break;
          }
          
          // Helper function to prune correction dialogs
          const pruneCorrections = (msgs: any[]): any[] => {
            const pruned: any[] = [];
            let skipNext = false;
            let correctionCount = 0;
            
            for (let i = 0; i < msgs.length; i++) {
              const msg = msgs[i];
              
              // Always keep system message
              if (msg.role === 'system') {
                pruned.push(msg);
                continue;
              }
              
              // Skip if marked by previous iteration
              if (skipNext) {
                skipNext = false;
                continue;
              }
              
              // Detect correction feedback from system
              if (msg.role === 'user' && 
                  (msg.content.includes('System: Your submitted code had errors') ||
                   msg.content.includes('System: Auto-corrections applied'))) {
                correctionCount++;
                console.error(`[PRUNE] Found correction message at index ${i}`);
                
                // This is a correction message - skip it and the wrong assistant response before it
                if (pruned.length > 0 && pruned[pruned.length - 1].role === 'assistant') {
                  console.error(`[PRUNE] Removing wrong assistant response`);
                  pruned.pop(); // Remove the wrong assistant response
                }
                
                // Skip this correction message
                // Next message should be the corrected assistant response - keep it
                if (i + 1 < msgs.length && msgs[i + 1].role === 'assistant') {
                  console.error(`[PRUNE] Keeping corrected assistant response`);
                  pruned.push(msgs[i + 1]);
                  skipNext = true; // Skip it in next iteration since we added it here
                }
                continue;
              }
              
              // Keep all other messages
              pruned.push(msg);
            }
            
            console.error(`[PRUNE] Processed ${msgs.length} messages, found ${correctionCount} corrections, result has ${pruned.length} messages`);
            return pruned;
          };
          
          // Prepare training example(s)
          const fullExample = { messages: dialog };
          const prunedExample = { messages: pruneCorrections(dialog) };
          
          // Show what will be saved
          console.log(`\nMode: ${saveMode}`);
          if (saveMode === 'full' || saveMode === 'both') {
            console.log(`Full dialog: ${dialog.length} messages`);
          }
          if (saveMode === 'pruned' || saveMode === 'both') {
            console.log(`Pruned dialog: ${prunedExample.messages.length} messages (removed ${dialog.length - prunedExample.messages.length} correction messages)`);
          }
          
          // Create temp file with appropriate content
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '-' + Date.now();
          const tempFile = path.join(os.tmpdir(), `dirac-training-${timestamp}.jsonl`);
          
          let tempContent: string;
          if (saveMode === 'both') {
            // Show both versions with clear separation
            tempContent = `// FULL VERSION (with corrections)\n${JSON.stringify(fullExample, null, 2)}\n\n// PRUNED VERSION (mistakes removed)\n${JSON.stringify(prunedExample, null, 2)}`;
          } else if (saveMode === 'pruned') {
            tempContent = JSON.stringify(prunedExample, null, 2);
          } else {
            tempContent = JSON.stringify(fullExample, null, 2);
          }
          
          // Write formatted JSON to temp file
          fs.writeFileSync(tempFile, tempContent, 'utf-8');
          
          console.log('Opening in editor...');
          
          // Open in editor
          const editor = process.env.EDITOR || process.env.VISUAL || 'vi';
          const { spawnSync } = await import('child_process');
          const result = spawnSync(editor, [tempFile], {
            stdio: 'inherit',
            shell: true,
          });
          
          if (result.error) {
            fs.unlinkSync(tempFile);
            console.error(`Failed to open editor: ${result.error.message}`);
            break;
          }
          
          if (result.status !== 0) {
            fs.unlinkSync(tempFile);
            console.error(`Editor exited with code ${result.status}`);
            break;
          }
          
          // Ask where to save
          const answer = await new Promise<string>((resolve) => {
            this.rl.question('Save to file (or press Enter to cancel): ', resolve);
          });
          
          if (!answer.trim()) {
            fs.unlinkSync(tempFile);
            console.log('Cancelled');
            break;
          }
          
          // Determine save path
          let savePath: string;
          if (answer.startsWith('/') || answer.startsWith('~')) {
            // Absolute path
            savePath = answer.replace(/^~/, os.homedir());
          } else if (answer.includes('/')) {
            // Relative path
            savePath = path.resolve(answer);
          } else {
            // Just filename - save to ~/.dirac/training/
            const trainingDir = path.join(os.homedir(), '.dirac', 'training');
            fs.mkdirSync(trainingDir, { recursive: true });
            savePath = path.join(trainingDir, answer.endsWith('.jsonl') ? answer : `${answer}.jsonl`);
          }
          
          // Read edited content and save
          const editedContent = fs.readFileSync(tempFile, 'utf-8');
          
          // Handle 'both' mode - extract both JSON objects
          if (saveMode === 'both') {
            // Remove comments and split by newlines to find JSON objects
            const lines = editedContent.split('\n');
            let fullJson = '';
            let prunedJson = '';
            let inFull = false;
            let inPruned = false;
            let braceCount = 0;
            
            for (const line of lines) {
              if (line.includes('// FULL VERSION')) {
                inFull = true;
                continue;
              }
              if (line.includes('// PRUNED VERSION')) {
                inFull = false;
                inPruned = true;
                continue;
              }
              
              if (inFull) {
                fullJson += line + '\n';
              } else if (inPruned) {
                prunedJson += line + '\n';
              }
            }
            
            // Parse and save both
            const fullData = JSON.parse(fullJson.trim());
            const prunedData = JSON.parse(prunedJson.trim());
            
            fs.appendFileSync(savePath, JSON.stringify(fullData) + '\n');
            fs.appendFileSync(savePath, JSON.stringify(prunedData) + '\n');
            console.log(`✓ Saved 2 training examples (full + pruned) to ${savePath}`);
          } else {
            // Single entry
            const editedData = JSON.parse(editedContent);
            fs.appendFileSync(savePath, JSON.stringify(editedData) + '\n');
            console.log(`✓ Saved training example (${saveMode}) to ${savePath}`);
          }
          
          // Clean up
          fs.unlinkSync(tempFile);
        } catch (error) {
          console.error('Error saving training data:', error instanceof Error ? error.message : String(error));
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
   * Check if command likely represents natural language based on first word
   */
  private isLikelyNaturalLanguage(command: string): boolean {
    const trimmed = command.trim().toLowerCase();
    
    // Question mark at end is a strong signal
    if (trimmed.endsWith('?')) return true;
    
    // Question words and polite words that suggest natural language
    const nlStarters = /^(what|why|how|where|when|which|who|can|could|would|should|please|may|might|do|does|did|is|are|was|were|will|shall)\s/i;
    return nlStarters.test(trimmed);
  }

  /**
   * Execute a Unix shell command
   * If command is not found, fallback to treating it as an AI query
   * Also fallback if command fails and looks like natural language
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
        
        // Check if this looks like natural language and command failed
        const likelyNaturalLanguage = code !== 0 && this.isLikelyNaturalLanguage(trimmed);
        
        if (commandNotFound || likelyNaturalLanguage) {
          // Notify user about fallback
          const reason = commandNotFound ? 'Command not found' : 'Command failed, looks like natural language';
          console.log(`💡 ${reason}, trying as AI query...`);
          
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
      console.log('No LLM provider configured.');
      console.log('Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable,');
      console.log('or create ~/.dirac/config.yml with llmProvider and llmModel.\n');
    }
    
    // Auto-index stdlib on first run
    const { registry } = await import('./tags/subroutine-index.js');
    const wasIndexed = await registry.autoIndexStdlib();
    
    // Load essential stdlib subroutines if available
    await this.loadEssentialSubroutines();
    
    // Run init script if configured
    if (this.config.initScript) {
      await this.runInitScript(this.config.initScript);
    }
    
    this.rl.prompt();
  }

  /**
   * Load essential stdlib subroutines into the session
   * This ensures basic helpers are available even without an init script
   */
  private async loadEssentialSubroutines(): Promise<void> {
    try {
      // Try to find and load ai.di from stdlib
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      
      const stdlibPackagePath = require.resolve('dirac-stdlib/package.json');
      const stdlibLibPath = path.join(path.dirname(stdlibPackagePath), 'lib');
      
      // List of essential files to load
      const essentialFiles = [
        'ai.di',      // AI helper subroutines
        'index.di',   // Core utilities
      ];
      
      let loadedCount = 0;
      for (const file of essentialFiles) {
        const filePath = path.join(stdlibLibPath, file);
        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const parser = new BraKetParser();
            const xml = parser.parse(content);
            const ast = this.xmlParser.parse(xml);
            
            // Import into session
            await integrate(this.session, ast);
            loadedCount++;
          } catch (err) {
            // Silently skip files that fail to load
            if (this.config.debug) {
              console.error(`Failed to load ${file}:`, err);
            }
          }
        }
      }
      
      if (loadedCount > 0 && this.config.debug) {
        console.log(`Loaded ${loadedCount} essential stdlib file(s)\n`);
      }
    } catch (err) {
      // Silently fail if stdlib not found - not critical
      if (this.config.debug) {
        console.error('Could not load essential subroutines:', err);
      }
    }
  }

  private async runInitScript(scriptPath: string): Promise<void> {
    try {
      // Resolve path relative to cwd
      const resolvedPath = path.isAbsolute(scriptPath) 
        ? scriptPath 
        : path.join(process.cwd(), scriptPath);
      
      if (!fs.existsSync(resolvedPath)) {
        // Silently skip - init script is optional
        return;
      }
      
      console.log(`Loading init script: ${resolvedPath}`);
      const scriptContent = fs.readFileSync(resolvedPath, 'utf-8');
      
      // If connected to agent, execute there; otherwise local
      if (this.client) {
        const xml = this.braketParser.parse(scriptContent);
        await this.client.execute(xml);
      } else {
        // Parse and execute locally
        const xml = this.braketParser.parse(scriptContent);
        const ast = this.xmlParser.parse(xml);
        
        // Set currentFile so imports resolve relative to init script location
        const oldCurrentFile = this.session.currentFile;
        this.session.currentFile = resolvedPath;
        
        await integrate(this.session, ast);
        
        // Restore original currentFile
        this.session.currentFile = oldCurrentFile;
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

  // Try config files in priority order
  const configPaths = [
    path.join(process.cwd(), 'config.yml'),
    path.join(process.env.HOME || '~', '.dirac', 'config.yml'),
  ];

  let configLoaded = false;
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const configData = yaml.load(fs.readFileSync(configPath, 'utf-8')) as any;
        
        // Resolve initScript path relative to config file directory
        let initScript = configData.initScript;
        if (initScript) {
          const configDir = path.dirname(configPath);
          initScript = path.resolve(configDir, initScript);
        }
        
        config = {
          ...config,
          llmProvider: configData.llmProvider || process.env.LLM_PROVIDER,
          llmModel: configData.llmModel || process.env.LLM_MODEL,
          customLLMUrl: configData.customLLMUrl || process.env.CUSTOM_LLM_URL,
          initScript: initScript,
        };
        configLoaded = true;
        break;
      } catch (err) {
        // Try next path
      }
    }
  }

  // Fallback to environment variables
  if (!configLoaded) {
    if (process.env.LLM_PROVIDER) {
      config.llmProvider = process.env.LLM_PROVIDER;
    }
    if (process.env.LLM_MODEL) {
      config.llmModel = process.env.LLM_MODEL;
    }
    if (process.env.CUSTOM_LLM_URL) {
      config.customLLMUrl = process.env.CUSTOM_LLM_URL;
    }
    
    // Auto-detect provider from API keys
    if (!config.llmProvider) {
      if (process.env.ANTHROPIC_API_KEY) {
        config.llmProvider = 'anthropic';
        config.llmModel = config.llmModel || 'claude-sonnet-4-5-20250929';
      } else if (process.env.OPENAI_API_KEY) {
        config.llmProvider = 'openai';
        config.llmModel = config.llmModel || 'gpt-4o';
      }
    }
    
    // Try global init script
    const globalInitScript = path.join(process.env.HOME || '~', '.dirac', 'shell-init.di');
    if (fs.existsSync(globalInitScript)) {
      config.initScript = globalInitScript;
    }
  }

  const shell = new DiracShell(config);
  await shell.start();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
