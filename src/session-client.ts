/**
 * DIRAC Session Client
 * 
 * Connects to a session server (daemon) via Unix socket.
 * Used by shell, Telegram bot, HTTP server, etc.
 */

import net from 'net';
import { EventEmitter } from 'events';

export interface SessionClientOptions {
  socketPath: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export class SessionClient extends EventEmitter {
  private socket: net.Socket | null = null;
  private buffer: string = '';
  private connected: boolean = false;
  private options: Required<SessionClientOptions>;

  constructor(options: SessionClientOptions) {
    super();
    this.options = {
      autoReconnect: false,
      reconnectDelay: 1000,
      ...options
    };
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = net.connect(this.options.socketPath);

      this.socket.on('connect', () => {
        // Socket is connected, but wait for welcome message before setting this.connected
        this.emit('socket-connected');
      });

      this.socket.on('data', (data) => {
        this.buffer += data.toString();

        // Process complete messages (newline-delimited JSON)
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const message = JSON.parse(line);
            this.handleMessage(message);
          } catch (error) {
            this.emit('error', new Error(`Invalid message: ${error}`));
          }
        }
      });

      this.socket.on('end', () => {
        this.connected = false;
        this.emit('disconnected');

        if (this.options.autoReconnect) {
          setTimeout(() => this.connect(), this.options.reconnectDelay);
        }
      });

      this.socket.on('error', (error) => {
        this.connected = false;
        reject(error);
        this.emit('error', error);
      });

      // Wait for welcome message
      this.once('welcome', () => {
        this.connected = true;  // Set connected flag when welcome received
        resolve();
      });
    });
  }

  private handleMessage(message: any): void {
    const { type, data, message: msg } = message;

    switch (type) {
      case 'welcome':
        this.emit('welcome', msg);
        break;

      case 'output':
        this.emit('output', data);
        break;

      case 'error':
        this.emit('error', new Error(msg || data));
        break;

      case 'vars':
        this.emit('vars', data);
        break;

      case 'state':
        this.emit('state', data);
        break;

      case 'shutdown':
        this.emit('shutdown');
        break;

      default:
        this.emit('message', message);
    }
  }

  async execute(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to session: socket is null'));
        return;
      }
      
      if (!this.connected) {
        reject(new Error('Not connected to session: connected flag is false'));
        return;
      }

      // Send execute message
      this.send({ type: 'execute', data: { command } });

      // Wait for output
      const timeout = setTimeout(() => {
        reject(new Error('Execution timeout'));
      }, 30000); // 30 second timeout

      const onOutput = (output: string) => {
        clearTimeout(timeout);
        this.off('error', onError);
        resolve(output);
      };

      const onError = (error: Error) => {
        clearTimeout(timeout);
        this.off('output', onOutput);
        reject(error);
      };

      this.once('output', onOutput);
      this.once('error', onError);
    });
  }

  async getVars(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.socket) {
        reject(new Error('Not connected to session'));
        return;
      }

      this.send({ type: 'getVars' });

      const timeout = setTimeout(() => {
        reject(new Error('Timeout getting variables'));
      }, 5000);

      const onVars = (vars: string[]) => {
        clearTimeout(timeout);
        resolve(vars);
      };

      this.once('vars', onVars);
    });
  }

  async getState(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to session: socket is null'));
        return;
      }
      
      if (!this.connected) {
        reject(new Error('Not connected to session: connected flag is false'));
        return;
      }

      this.send({ type: 'getState' });

      const timeout = setTimeout(() => {
        reject(new Error('Timeout getting state'));
      }, 5000);

      const onState = (state: any) => {
        clearTimeout(timeout);
        resolve(state);
      };

      this.once('state', onState);
    });
  }

  async shutdown(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.connected || !this.socket) {
        resolve();
        return;
      }

      this.send({ type: 'shutdown' });

      this.once('shutdown', () => {
        resolve();
      });
    });
  }

  private send(message: any): void {
    if (!this.socket || !this.connected) {
      throw new Error('Not connected to session');
    }

    this.socket.write(JSON.stringify(message) + '\n');
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
