/**
 * <browser> tag - Display HTML content in a browser window
 * 
 * Usage:
 *   <browser port="3000" title="My Page">
 *     <html>
 *       <body><h1>Hello World</h1></body>
 *     </html>
 *   </browser>
 * 
 * Opens a temporary HTTP server and launches the HTML in the default browser
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit } from '../runtime/session.js';
import * as http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Store active servers to clean up later
const activeServers = new Map<number, http.Server>();

export async function executeBrowser(session: DiracSession, element: DiracElement): Promise<void> {
  const portAttr = element.attributes.port;
  const titleAttr = element.attributes.title || 'DIRAC Browser';
  const autoCloseAttr = element.attributes['auto-close']; // Close server after opening
  const keepOpenAttr = element.attributes['keep-open']; // Keep server running
  
  // Extract HTML content - look for <html> child or use text content
  let htmlContent = '';
  
  if (element.children && element.children.length > 0) {
    // Look for <html> child element
    const htmlChild = element.children.find(child => child.tag === 'html');
    if (htmlChild) {
      htmlContent = renderElementToHTML(htmlChild);
    } else {
      // Use all children as body content
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${titleAttr}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
${element.children.map(child => renderElementToHTML(child)).join('\n')}
</body>
</html>`;
    }
  } else if (element.text) {
    // Use text content as HTML
    htmlContent = element.text.trim();
    
    // Wrap in full HTML if not already a complete document
    if (!htmlContent.toLowerCase().includes('<html')) {
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${titleAttr}</title>
</head>
<body>
${htmlContent}
</body>
</html>`;
    }
  } else {
    throw new Error('<browser> requires HTML content');
  }
  
  // Choose port
  const port = portAttr ? parseInt(portAttr, 10) : await findAvailablePort();
  
  // Create HTTP server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
  });
  
  // Start server
  await new Promise<void>((resolve, reject) => {
    server.listen(port, () => {
      if (session.debug) {
        console.error(`[BROWSER] Server started on port ${port}`);
      }
      resolve();
    });
    
    server.on('error', reject);
  });
  
  // Store server reference
  activeServers.set(port, server);
  
  const url = `http://localhost:${port}`;
  
  // Open in default browser
  await openBrowser(url);
  
  emit(session, `Browser opened at ${url}\n`);
  
  // Handle cleanup
  if (autoCloseAttr === 'true') {
    // Close after a short delay (let browser load)
    setTimeout(() => {
      server.close();
      activeServers.delete(port);
      if (session.debug) {
        console.error(`[BROWSER] Server on port ${port} closed`);
      }
    }, 2000);
  } else if (keepOpenAttr !== 'true') {
    // Default: close after first request
    let requestCount = 0;
    server.on('request', () => {
      requestCount++;
      if (requestCount >= 1) {
        setTimeout(() => {
          server.close();
          activeServers.delete(port);
          if (session.debug) {
            console.error(`[BROWSER] Server on port ${port} closed after serving`);
          }
        }, 1000);
      }
    });
  }
  // If keep-open="true", server stays running
}

/**
 * Render DIRAC element to HTML string
 */
function renderElementToHTML(element: DiracElement): string {
  if (element.text && (!element.children || element.children.length === 0)) {
    return element.text;
  }
  
  const tag = element.tag;
  const attrs = Object.entries(element.attributes || {})
    .map(([key, value]) => `${key}="${escapeHTML(String(value))}"`)
    .join(' ');
  
  const children = element.children
    ? element.children.map(child => renderElementToHTML(child)).join('')
    : '';
  
  const text = element.text || '';
  
  return `<${tag}${attrs ? ' ' + attrs : ''}>${text}${children}</${tag}>`;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Find an available port
 */
async function findAvailablePort(startPort: number = 3000): Promise<number> {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(0, () => {
      const port = (server.address() as any).port;
      server.close(() => resolve(port));
    });
  });
}

/**
 * Open URL in default browser
 */
async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  
  let command: string;
  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "${url}"`;
  } else {
    // Linux
    command = `xdg-open "${url}"`;
  }
  
  try {
    await execAsync(command);
  } catch (err) {
    console.error(`Failed to open browser: ${err}`);
  }
}

/**
 * Close all active browser servers
 */
export function closeAllBrowserServers(): void {
  for (const [port, server] of activeServers.entries()) {
    server.close();
    console.log(`Closed browser server on port ${port}`);
  }
  activeServers.clear();
}
