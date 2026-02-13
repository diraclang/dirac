/**
 * Simple test runner for Dirac
 * Tests are defined as .di files with expected output in comments
 */

import fs from 'fs';
import path from 'path';
import { DiracParser } from './runtime/parser.js';
import { createSession, getOutput } from './runtime/session.js';
import { integrate } from './runtime/interpreter.js';
import yaml from 'js-yaml';

interface TestCase {
  name: string;
  file: string;
  expectedOutput?: string;
  expectedError?: string;
  config?: any;
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  actualOutput?: string;
  expectedOutput?: string;
}

export class TestRunner {
  private testDir: string;
  private config: any;

  constructor(testDir: string = 'tests', configPath?: string) {
    this.testDir = testDir;
    
    // For tests, always use ollama as the default provider (no API keys needed)
    // Unless a specific test config is provided
    if (configPath && fs.existsSync(configPath)) {
      this.config = yaml.load(fs.readFileSync(configPath, 'utf8')) || {};
    } else {
      this.config = { llmProvider: 'ollama', llmModel: 'llama2' };
    }
  }

  /**
   * Parse test metadata from comments in .di file
   * Format:
   *   <!-- TEST: test_name -->
   *   <!-- EXPECT: expected output -->
   *   <!-- EXPECT_ERROR: expected error message -->
   */
  private parseTestMetadata(content: string): { name?: string; expected?: string; expectError?: string } {
    const nameMatch = content.match(/<!--\s*TEST:\s*(.+?)\s*-->/);
    const expectMatch = content.match(/<!--\s*EXPECT:\s*(.+?)\s*-->/s);
    const errorMatch = content.match(/<!--\s*EXPECT_ERROR:\s*(.+?)\s*-->/s);
    
    return {
      name: nameMatch?.[1],
      expected: expectMatch?.[1]?.trim(),
      expectError: errorMatch?.[1]?.trim(),
    };
  }

  /**
   * Run a single test file
   */
  async runTest(filePath: string): Promise<TestResult> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const metadata = this.parseTestMetadata(content);
    const testName = metadata.name || path.basename(filePath);

    // Remove test comments before execution
    const cleanContent = content
      .replace(/<!--\s*TEST:.*?-->/gs, '')
      .replace(/<!--\s*EXPECT:.*?-->/gs, '')
      .replace(/<!--\s*EXPECT_ERROR:.*?-->/gs, '');

    const result: TestResult = {
      name: testName,
      passed: false,
    };

    try {
      // Check if there's a stdin input file for this test
      const stdinFile = filePath.replace('.test.di', '.txt');
      let stdinData: string | undefined;
      if (fs.existsSync(stdinFile)) {
        stdinData = fs.readFileSync(stdinFile, 'utf-8');
      }

      // If stdin data exists, we need to mock stdin
      // Since we can't replace process.stdin directly, we'll use a workaround:
      // temporarily store data in a place the input tag can access it
      if (stdinData !== undefined) {
        // Save original methods
        const originalOn = process.stdin.on.bind(process.stdin);
        const originalResume = process.stdin.resume.bind(process.stdin);
        const originalRemoveAllListeners = process.stdin.removeAllListeners.bind(process.stdin);
        const originalRemoveListener = process.stdin.removeListener.bind(process.stdin);
        
        // Mock stdin methods
        const listeners: { [key: string]: Function[] } = {};
        
        (process.stdin as any).on = function(event: string, callback: Function) {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(callback);
          return this;
        };
        
        (process.stdin as any).removeAllListeners = function(event?: string) {
          if (event) {
            delete listeners[event];
          } else {
            Object.keys(listeners).forEach(k => delete listeners[k]);
          }
          return this;
        };
        
        (process.stdin as any).removeListener = function(event: string, callback: Function) {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter(fn => fn !== callback);
          }
          return this;
        };
        
        (process.stdin as any).resume = function() {
          // Simulate data event
          setImmediate(() => {
            if (listeners['data']) {
              listeners['data'].forEach(fn => fn(Buffer.from(stdinData!, 'utf-8')));
            }
            // Simulate end event
            setImmediate(() => {
              if (listeners['end']) {
                listeners['end'].forEach(fn => fn());
              }
            });
          });
          return this;
        };
        
        try {
          const parser = new DiracParser();
          const ast = parser.parse(cleanContent);
          const session = createSession({ ...this.config, filePath });
          await integrate(session, ast);
          const output = getOutput(session);
          result.actualOutput = output;
        } finally {
          // Restore original methods
          (process.stdin as any).on = originalOn;
          (process.stdin as any).resume = originalResume;
          (process.stdin as any).removeAllListeners = originalRemoveAllListeners;
          (process.stdin as any).removeListener = originalRemoveListener;
        }
      } else {
        // Normal test without stdin
        const parser = new DiracParser();
        const ast = parser.parse(cleanContent);
        const session = createSession({ ...this.config, filePath });
        await integrate(session, ast);
        const output = getOutput(session);
        result.actualOutput = output;
      }

      if (metadata.expectError) {
        // Expected an error but got success
        result.passed = false;
        result.error = `Expected error but test succeeded. Output: ${result.actualOutput}`;
      } else if (metadata.expected !== undefined) {
        // Check if output matches expected
        // Normalize whitespace for comparison (collapse multiple spaces/newlines)
        const normalizedActual = result.actualOutput!.replace(/\s+/g, ' ').trim();
        const normalizedExpected = metadata.expected.replace(/\s+/g, ' ').trim();
        
        if (normalizedActual === normalizedExpected) {
          result.passed = true;
        } else {
          result.passed = false;
          result.error = `Output mismatch`;
          result.expectedOutput = normalizedExpected;
          result.actualOutput = normalizedActual;
        }
      } else {
        // No expected output specified, just check it runs without error
        result.passed = true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (metadata.expectError) {
        // Check if error matches expected
        if (errorMessage.includes(metadata.expectError)) {
          result.passed = true;
        } else {
          result.passed = false;
          result.error = `Error mismatch. Expected: "${metadata.expectError}", Got: "${errorMessage}"`;
        }
      } else {
        // Unexpected error
        result.passed = false;
        result.error = errorMessage;
      }
    }

    return result;
  }

  /**
   * Run all tests in the test directory
   */
  async runAll(pattern: string = '*.test.di'): Promise<TestResult[]> {
    const testFiles = this.findTestFiles(this.testDir, pattern);
    const results: TestResult[] = [];

    console.log(`Running ${testFiles.length} tests...\n`);

    for (const file of testFiles) {
      const result = await this.runTest(file);
      results.push(result);
      
      // Print result immediately
      if (result.passed) {
        console.log(`✓ ${result.name}`);
      } else {
        console.log(`✗ ${result.name}`);
        if (result.error) {
          console.log(`  Error: ${result.error}`);
        }
        if (result.expectedOutput !== undefined && result.actualOutput !== undefined) {
          console.log(`  Expected: ${JSON.stringify(result.expectedOutput)}`);
          console.log(`  Actual:   ${JSON.stringify(result.actualOutput)}`);
        }
      }
    }

    return results;
  }

  /**
   * Find test files matching pattern
   */
  private findTestFiles(dir: string, pattern: string): string[] {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...this.findTestFiles(fullPath, pattern));
      } else if (entry.isFile() && entry.name.endsWith('.test.di')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Print summary of test results
   */
  printSummary(results: TestResult[]): void {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log('\n' + '='.repeat(50));
    console.log(`Tests: ${passed} passed, ${failed} failed, ${results.length} total`);
    
    if (failed > 0) {
      console.log('\nFailed tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}`);
      });
    }
    
    console.log('='.repeat(50));
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const testDir = process.argv[2] || 'tests';
  const runner = new TestRunner(testDir);
  
  runner.runAll().then(results => {
    runner.printSummary(results);
    
    // Exit with error code if any tests failed
    const failed = results.filter(r => !r.passed).length;
    process.exit(failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}
