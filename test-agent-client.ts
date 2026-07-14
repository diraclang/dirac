#!/usr/bin/env node

/**
 * Simple test client to execute DIRAC code on the agent
 */

import fs from 'fs';
import { SessionClient } from './src/session-client.js';

async function main() {
  const filename = process.argv[2];
  
  if (!filename) {
    console.error('Usage: node test-agent-client.ts <file.di>');
    process.exit(1);
  }
  
  const code = fs.readFileSync(filename, 'utf-8');
  
  const client = new SessionClient();
  
  client.on('output', (data) => {
    console.log('Output:', data);
  });
  
  client.on('error', (error) => {
    console.error('Error:', error);
  });
  
  try {
    await client.connect();
    console.log('Connected to agent');
    
    const result = await client.execute(code);
    console.log('Result:', result);
    
    await client.disconnect();
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

main();
