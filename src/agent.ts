/**
 * DIRAC Agent - Persistent daemon with interactive CLI
 * 
 * Usage:
 *   dirac agent start    - Start daemon in background
 *   dirac agent stop     - Stop running daemon
 *   dirac agent status   - Check daemon status
 *   dirac agent restart  - Restart daemon
 *   dirac agent logs     - Show daemon logs
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { SessionServer, isSessionRunning, getSocketPath } from './session-server.js';

const AGENT_DIR = path.join(os.homedir(), '.dirac');
const PID_FILE = path.join(AGENT_DIR, 'session.pid');  // Use session.pid to match session-server
const LOG_FILE = path.join(AGENT_DIR, 'agent.log');

export class AgentCLI {
  async start(): Promise<void> {
    // Check if already running
    if (isSessionRunning()) {
      console.log('Agent is already running');
      const pid = this.getRunningPid();
      if (pid) {
        console.log(`PID: ${pid}`);
        console.log(`Socket: ${getSocketPath()}`);
        console.log(`Logs: ${LOG_FILE}`);
      }
      return;
    }

    // Ensure directory exists
    if (!fs.existsSync(AGENT_DIR)) {
      fs.mkdirSync(AGENT_DIR, { recursive: true });
    }

    // Start daemon process
    console.log('Starting DIRAC agent...');
    
    // Setup log file path for daemon
    const logFd = fs.openSync(LOG_FILE, 'a');
    
    const child = spawn(
      process.argv[0],  // node executable
      [process.argv[1], 'agent', 'daemon'],  // dirac agent daemon
      {
        detached: true,
        stdio: ['ignore', logFd, logFd],  // Redirect stdout/stderr to log file
        cwd: process.cwd()
      }
    );

    // Close our reference to the log file descriptor
    fs.closeSync(logFd);
    
    // Don't write PID here - let the daemon (SessionServer) write its own PID

    // Detach from parent
    child.unref();

    // Wait for daemon to start (check multiple times)
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (isSessionRunning()) {
        console.log('✓ Agent started successfully');
        console.log(`  PID: ${child.pid}`);
        console.log(`  Socket: ${getSocketPath()}`);
        console.log(`  Logs: ${LOG_FILE}`);
        console.log('');
        console.log('Connect with: dirac shell --agent');
        return;
      }
      
      attempts++;
    }
    
    // Failed to start after all attempts
    console.error('✗ Failed to start agent');
    console.error('Check logs:', LOG_FILE);
    process.exit(1);
  }

  async stop(): Promise<void> {
    const pid = this.getRunningPid();
    
    if (!pid) {
      console.log('Agent is not running');
      return;
    }

    console.log(`Stopping agent (PID: ${pid})...`);

    try {
      // Send SIGTERM for graceful shutdown
      process.kill(pid, 'SIGTERM');

      // Wait for process to exit
      let attempts = 0;
      while (attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          process.kill(pid, 0); // Check if still alive
          attempts++;
        } catch {
          // Process exited
          console.log('✓ Agent stopped');
          this.cleanup();
          return;
        }
      }

      // Force kill if still running
      console.log('Agent did not stop gracefully, forcing...');
      process.kill(pid, 'SIGKILL');
      this.cleanup();
      console.log('✓ Agent stopped (forced)');
    } catch (error: any) {
      if (error.code === 'ESRCH') {
        // Process doesn't exist
        console.log('Agent was not running');
        this.cleanup();
      } else {
        console.error('Error stopping agent:', error.message);
        process.exit(1);
      }
    }
  }

  async status(): Promise<void> {
    const pid = this.getRunningPid();

    if (!pid) {
      console.log('Status: NOT RUNNING');
      return;
    }

    try {
      // Check if process is alive
      process.kill(pid, 0);
      
      console.log('Status: RUNNING');
      console.log(`PID: ${pid}`);
      console.log(`Socket: ${getSocketPath()}`);
      console.log(`Logs: ${LOG_FILE}`);
      
      // Show uptime
      if (fs.existsSync(PID_FILE)) {
        const stats = fs.statSync(PID_FILE);
        const uptime = Date.now() - stats.mtimeMs;
        console.log(`Uptime: ${this.formatUptime(uptime)}`);
      }
    } catch (error: any) {
      if (error.code === 'ESRCH') {
        console.log('Status: NOT RUNNING (stale PID file)');
        this.cleanup();
      } else {
        throw error;
      }
    }
  }

  async restart(): Promise<void> {
    console.log('Restarting agent...');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.start();
  }

  async logs(follow: boolean = false): Promise<void> {
    if (!fs.existsSync(LOG_FILE)) {
      console.log('No logs found');
      return;
    }

    if (follow) {
      // Use tail -f
      const { spawn } = await import('child_process');
      const tail = spawn('tail', ['-f', LOG_FILE], {
        stdio: 'inherit'
      });

      // Handle Ctrl-C
      process.on('SIGINT', () => {
        tail.kill();
        process.exit(0);
      });
    } else {
      // Show last 50 lines
      const content = fs.readFileSync(LOG_FILE, 'utf-8');
      const lines = content.split('\n');
      const lastLines = lines.slice(-50);
      console.log(lastLines.join('\n'));
    }
  }

  private getRunningPid(): number | null {
    if (!fs.existsSync(PID_FILE)) {
      return null;
    }

    try {
      const pidStr = fs.readFileSync(PID_FILE, 'utf-8').trim();
      return parseInt(pidStr, 10);
    } catch {
      return null;
    }
  }

  private cleanup(): void {
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
    // Socket file is cleaned up by SessionServer
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }
}

/**
 * Run the actual daemon (called by spawn)
 */
export async function runAgentDaemon(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Starting DIRAC agent daemon`);
  
  // Load configuration from config.yml if available
  let config: any = {};
  try {
    const fs = await import('fs');
    const path = await import('path');
    const yaml = await import('js-yaml');
    
    const configPath = path.default.resolve(process.cwd(), 'config.yml');
    if (fs.default.existsSync(configPath)) {
      const configData = yaml.default.load(fs.default.readFileSync(configPath, 'utf-8')) as any;
      config = {
        llmProvider: configData.llmProvider,
        llmModel: configData.llmModel,
        customLLMUrl: configData.customLLMUrl,
        initScript: configData.initScript
      };
      console.log(`[${new Date().toISOString()}] Loaded config: LLM=${config.llmProvider}/${config.llmModel}`);
    }
  } catch (err) {
    console.log(`[${new Date().toISOString()}] No config.yml found, using defaults`);
  }
  
  const server = new SessionServer(config);
  
  try {
    await server.start();
    console.log(`[${new Date().toISOString()}] Agent daemon started successfully`);
    
    // Handle graceful shutdown
    const shutdown = async () => {
      console.log(`[${new Date().toISOString()}] Shutting down agent daemon`);
      await server.shutdown();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Keep process alive
    await new Promise(() => {}); // Never resolves
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to start agent:`, error);
    process.exit(1);
  }
}
