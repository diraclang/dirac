/**
 * DIRAC Session Server (Daemon)
 * 
 * Persistent session that listens on a Unix socket.
 * Multiple clients can connect, disconnect, and reconnect.
 * State (variables, cron jobs, etc.) persists across connections.
 */

import net from 'net';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createSession } from './runtime/session.js';
import { integrate } from './runtime/interpreter.js';
import { DiracParser } from './runtime/parser.js';
import type { DiracSession } from './types/index.js';

const SOCKET_DIR = path.join(os.homedir(), '.dirac');
const SOCKET_PATH = path.join(SOCKET_DIR, 'session.sock');
const PID_PATH = path.join(SOCKET_DIR, 'session.pid');

interface ClientConnection {
  id: string;
  socket: net.Socket;
}

export class SessionServer {
  private server: net.Server;
  private session: DiracSession;
  private clients: Map<string, ClientConnection> = new Map();
  private clientIdCounter = 0;

  constructor(config?: any) {
    this.session = createSession(config || {});
    this.server = net.createServer(this.handleConnection.bind(this));
  }

  async start(): Promise<void> {
    // Ensure socket directory exists
    if (!fs.existsSync(SOCKET_DIR)) {
      fs.mkdirSync(SOCKET_DIR, { recursive: true });
    }

    // Remove old socket if exists
    if (fs.existsSync(SOCKET_PATH)) {
      fs.unlinkSync(SOCKET_PATH);
    }

    // Start listening
    return new Promise((resolve, reject) => {
      this.server.listen(SOCKET_PATH, () => {
        console.log(`[session-server] Listening on ${SOCKET_PATH}`);
        
        // Write PID file
        fs.writeFileSync(PID_PATH, process.pid.toString());
        
        // Make socket accessible
        fs.chmodSync(SOCKET_PATH, 0o600);
        
        resolve();
      });

      this.server.on('error', (error) => {
        console.error('[session-server] Error:', error);
        reject(error);
      });
    });
  }

  private handleConnection(socket: net.Socket): void {
    const clientId = `client-${++this.clientIdCounter}`;
    const client: ClientConnection = { id: clientId, socket };
    this.clients.set(clientId, client);

    console.log(`[session-server] Client connected: ${clientId}`);

    let buffer = '';

    socket.on('data', async (data) => {
      buffer += data.toString();

      // Process complete messages (newline-delimited JSON)
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const message = JSON.parse(line);
          await this.handleMessage(client, message);
        } catch (error) {
          this.sendError(client, `Invalid message: ${error}`);
        }
      }
    });

    socket.on('end', () => {
      console.log(`[session-server] Client disconnected: ${clientId}`);
      this.clients.delete(clientId);
    });

    socket.on('error', (error) => {
      console.error(`[session-server] Client error (${clientId}):`, error);
      this.clients.delete(clientId);
    });

    // Send welcome message
    this.sendResponse(client, {
      type: 'welcome',
      sessionId: clientId,
      message: 'Connected to DIRAC session'
    });
  }

  private async handleMessage(client: ClientConnection, message: any): Promise<void> {
    const { type, data } = message;

    switch (type) {
      case 'execute':
        await this.executeCommand(client, data.command);
        break;

      case 'getVars':
        this.sendResponse(client, {
          type: 'vars',
          data: Object.keys(this.session.variables)
        });
        break;

      case 'getState':
        this.sendResponse(client, {
          type: 'state',
          data: {
            variables: this.session.variables,
            subroutines: this.session.subroutines,
            varBoundary: this.session.varBoundary,
            subBoundary: this.session.subBoundary
          }
        });
        break;

      case 'shutdown':
        this.sendResponse(client, {
          type: 'shutdown',
          message: 'Server shutting down'
        });
        await this.shutdown();
        break;

      default:
        this.sendError(client, `Unknown message type: ${type}`);
    }
  }

  private async executeCommand(client: ClientConnection, command: string): Promise<void> {
    try {
      // Clear previous output
      this.session.output = [];

      // Parse and execute
      const parser = new DiracParser();
      const ast = parser.parse(command);
      await integrate(this.session, ast);

      // Send output back to client
      const output = this.session.output.join('');
      this.sendResponse(client, {
        type: 'output',
        data: output
      });
    } catch (error: any) {
      this.sendError(client, error.message);
    }
  }

  private sendResponse(client: ClientConnection, response: any): void {
    try {
      client.socket.write(JSON.stringify(response) + '\n');
    } catch (error) {
      console.error(`[session-server] Failed to send response:`, error);
    }
  }

  private sendError(client: ClientConnection, message: string): void {
    this.sendResponse(client, {
      type: 'error',
      message
    });
  }

  async shutdown(): Promise<void> {
    console.log('[session-server] Shutting down...');

    // Close all client connections
    for (const client of this.clients.values()) {
      client.socket.end();
    }
    this.clients.clear();

    // Close server
    return new Promise((resolve) => {
      this.server.close(() => {
        // Remove socket and PID files
        if (fs.existsSync(SOCKET_PATH)) {
          fs.unlinkSync(SOCKET_PATH);
        }
        if (fs.existsSync(PID_PATH)) {
          fs.unlinkSync(PID_PATH);
        }

        console.log('[session-server] Shutdown complete');
        resolve();
      });
    });
  }
}

/**
 * Check if a session daemon is running
 */
export function isSessionRunning(): boolean {
  if (!fs.existsSync(PID_PATH)) {
    return false;
  }

  // Check if PID is still alive
  try {
    const pid = parseInt(fs.readFileSync(PID_PATH, 'utf-8').trim(), 10);
    process.kill(pid, 0); // Signal 0 checks if process exists
    return true;
  } catch (error) {
    // Process doesn't exist, clean up stale files
    if (fs.existsSync(PID_PATH)) fs.unlinkSync(PID_PATH);
    // Note: Unix socket files may not be visible to fs.existsSync on some systems
    try {
      if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);
    } catch (e) {
      // Ignore cleanup errors
    }
    return false;
  }
}

/**
 * Get the socket path for connecting
 */
export function getSocketPath(): string {
  return SOCKET_PATH;
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SessionServer();
  
  server.start().then(() => {
    console.log('[session-server] Server started successfully');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n[session-server] Received SIGINT, shutting down...');
      await server.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n[session-server] Received SIGTERM, shutting down...');
      await server.shutdown();
      process.exit(0);
    });
  }).catch((error) => {
    console.error('[session-server] Failed to start:', error);
    process.exit(1);
  });
}
