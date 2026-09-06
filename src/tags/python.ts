/**
 * <python> tag - execute Python code with access to session variables
 * Python code runs in subprocess as a leaf node (no child execution)
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { setVariable } from '../runtime/session.js';
import { execSync, spawn } from 'child_process';

function toEmbeddedJson(value: unknown): string {
  return JSON.stringify(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Remove common leading whitespace from all lines (dedent)
 * Handles the common XML pattern where first line is inline with opening tag
 */
function dedent(text: string): string {
  const lines = text.split('\n');
  
  // If only one line, just trim it
  if (lines.length === 1) {
    return lines[0].trim();
  }
  
  // Find minimum indentation (ignoring empty lines and optionally the first line)
  let minIndent = Infinity;
  let firstLineIndent: number | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue; // Skip empty lines
    
    const indent = line.match(/^[ \t]*/)?.[0].length ?? 0;
    
    if (i === 0) {
      firstLineIndent = indent;
    } else {
      minIndent = Math.min(minIndent, indent);
    }
  }
  
  // If all non-first lines are empty, or no indentation found, return trimmed
  if (minIndent === Infinity) {
    return text.trim();
  }
  
  // If first line has less indentation than others (common in XML inline text),
  // dedent based on the minimum of the remaining lines
  const dedentAmount = (firstLineIndent !== null && firstLineIndent < minIndent) 
    ? minIndent 
    : Math.min(firstLineIndent ?? Infinity, minIndent);
  
  if (dedentAmount === 0 || dedentAmount === Infinity) {
    return text.trim();
  }
  
  // Remove the common indentation from each line
  return lines.map((line, i) => {
    if (line.trim() === '') return ''; // Preserve empty lines as empty
    // For first line, only dedent if it has at least the dedent amount
    if (i === 0 && firstLineIndent !== null && firstLineIndent < dedentAmount) {
      return line; // Keep first line as-is if it has less indentation
    }
    return line.slice(dedentAmount);
  }).join('\n').trim();
}

export async function executePython(session: DiracSession, element: DiracElement): Promise<void> {
  const resultVar = element.attributes.result;
  const backgroundAttr = element.attributes.background;
  // Default to foreground execution so simple scripts/demos behave predictably
  // and their output/errors are visible immediately. Use background="true"
  // explicitly for fire-and-forget long-running processes.
  const isBackground = backgroundAttr === 'true';
  const pythonCode = element.text;

  if (!pythonCode || pythonCode.trim() === '') {
    throw new Error('<python> requires Python code as text content');
  }

  // Dedent the Python code to remove common leading whitespace
  const dedentedCode = dedent(pythonCode);

  if (session.debug) {
    console.error(`[PYTHON] Executing${isBackground ? ' (background)' : ''}:\n${dedentedCode}\n`);
  }
  
  // Background mode - spawn and don't wait (for long-running servers/daemons)
  if (isBackground) {
    // For background mode, we can't access session variables or return results
    // Write Python code to stdin of spawned process
    const stdio: ['pipe', any, any] = [
      'pipe', // stdin - we write code to this
      session.debug ? 'inherit' : 'ignore', // stdout - show if debugging
      session.debug ? 'inherit' : 'ignore', // stderr - show if debugging
    ];
    
    const child = spawn('python3', [], {
      detached: true,
      stdio,
      shell: false,
    });
    
    // Write the Python code to stdin
    if (child.stdin) {
      child.stdin.write(dedentedCode);
      child.stdin.end();
    }
    
    // Unref so parent can exit without waiting
    child.unref();
    
    if (session.debug) {
      console.error(`[PYTHON] Background process started with PID: ${child.pid}`);
    }
    
    return;
  }

  try {
    // Serialize session variables to JSON for Python access
    const varsForPython: Record<string, any> = {};
    for (const v of session.variables) {
      // Only pass JSON-serializable values
      try {
        let value = v.value;
        
        // Auto-parse JSON strings to JavaScript objects (like eval.ts does)
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
              (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
              value = JSON.parse(trimmed);
            } catch (e) {
              // If parsing fails, keep as string
            }
          }
        }
        
        JSON.stringify(value);
        varsForPython[v.name] = value;
        if (session.debug) {
          console.error(`[PYTHON] Adding variable '${v.name}' = ${JSON.stringify(value)}`);
        }
      } catch (e) {
        if (session.debug) {
          console.error(`[PYTHON] Warning: Variable '${v.name}' is not JSON-serializable, skipping`);
        }
      }
    }
    
    if (session.debug) {
      console.error(`[PYTHON] Total variables to pass: ${Object.keys(varsForPython).length}`);
      console.error(`[PYTHON] Variables: ${JSON.stringify(varsForPython)}`);
    }

    const subroutinesForPython = session.subroutines.map((sub, index) => ({
      index,
      name: sub.name,
      description: sub.description ?? '',
      parameters: sub.parameters ?? [],
      meta: sub.meta ?? {},
      boundary: sub.boundary,
      visible: Boolean(sub.visible),
      sourcePath: sub.sourcePath ?? '',
    }));

    const sessionForPython = {
      varBoundary: session.varBoundary,
      subBoundary: session.subBoundary,
      outputBoundary: session.outputBoundary,
      parameterStackDepth: session.parameterStack.length,
      currentSubroutineName: session.currentSubroutineName ?? null,
      limits: session.limits,
      debug: Boolean(session.debug),
      subroutines: subroutinesForPython,
    };

    const varsJsonStr = toEmbeddedJson(varsForPython);
    const subroutinesJsonStr = toEmbeddedJson(subroutinesForPython);
    const sessionJsonStr = toEmbeddedJson(sessionForPython);

    // Check if code contains return statement - if so, wrap in function
    const hasReturn = /^\s*return\s+/m.test(dedentedCode);
    
    // Build Python script that:
    // 1. Loads variables into globals
    // 2. Exposes subroutine stack/session snapshot
    // 2. Executes user code (wrapped in function if it has return)
    // 3. Returns result as JSON (if result attribute specified)
    
    let executionCode: string;
    if (hasReturn && resultVar) {
      // Wrap code in function and call it, capturing return value
      const indentedCode = dedentedCode.split('\n').map(line => '    ' + line).join('\n');
      executionCode = `
def __dirac_function():
${indentedCode}

${resultVar} = __dirac_function()`;
    } else {
      // Execute code directly
      executionCode = dedentedCode;
    }
    
    const pythonScript = `
import json
import sys

# Load session variables into global namespace
__dirac_vars = json.loads('''${varsJsonStr}''')
__dirac_subroutines = json.loads('''${subroutinesJsonStr}''')
__dirac_session = json.loads('''${sessionJsonStr}''')
globals().update(__dirac_vars)

# Execute user code
${executionCode}

# Return result if specified
${resultVar ? `
try:
    __result = ${resultVar}
    __payload = {"__dirac_result__": __result}
    if '__dirac_updates' in globals():
        __payload["__dirac_updates__"] = __dirac_updates
    print(json.dumps(__payload))
except NameError:
    print(json.dumps({"__dirac_error__": "Variable '${resultVar}' not defined in Python code"}), file=sys.stderr)
    sys.exit(1)
` : ''}
`;

    if (session.debug) {
      console.error(`[PYTHON] Full script:\n${pythonScript}\n`);
    }

    // Execute Python subprocess
    const output = execSync('python3', {
      input: pythonScript,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    // Parse result if result attribute was specified
    if (resultVar) {
      const trimmedOutput = output.trim();
      if (!trimmedOutput) {
        throw new Error('Python script produced no output');
      }

      // Get the last line (should be our JSON result)
      const lines = trimmedOutput.split('\n');
      const jsonLine = lines[lines.length - 1];

      // Emit all output except the last JSON line
      if (lines.length > 1) {
        const userOutput = lines.slice(0, -1).join('\n');
        if (userOutput.trim()) {
          session.output.push(userOutput + '\n');
        }
      }

      try {
        const result = JSON.parse(jsonLine);
        
        if (result.__dirac_error__) {
          throw new Error(result.__dirac_error__);
        }

        if (session.debug) {
          console.error(`[PYTHON] Result: ${JSON.stringify(result.__dirac_result__)}`);
        }

        // Store result in session
        setVariable(session, resultVar, result.__dirac_result__, false);

        const updates = result.__dirac_updates__;
        if (updates && typeof updates === 'object' && !Array.isArray(updates)) {
          const updateEntries = Object.entries(updates as Record<string, unknown>);
          for (const [name, value] of updateEntries) {
            setVariable(session, name, value, false);
          }
          if (session.debug && updateEntries.length > 0) {
            console.error(`[PYTHON] Applied ${updateEntries.length} variable update(s) from __dirac_updates`);
          }
        }
        
        if (session.debug) {
          console.error(`[PYTHON] Stored variable '${resultVar}' = ${JSON.stringify(result.__dirac_result__)}`);
        }
        
        // Writeback mechanism: if the result variable has a refName, propagate back to source
        // Search from end to find the most recent variable with this name
        let resultVariable = null;
        for (let i = session.variables.length - 1; i >= 0; i--) {
          if (session.variables[i].name === resultVar) {
            resultVariable = session.variables[i];
            break;
          }
        }
        if (resultVariable && resultVariable.refName && typeof resultVariable.value === 'object') {
          if (session.debug) {
            console.error(`[PYTHON] Writing back modified object to source variable: ${resultVariable.refName}`);
          }
          setVariable(session, resultVariable.refName, resultVariable.value, false);
        }
      } catch (parseError) {
        throw new Error(`Failed to parse Python result: ${parseError instanceof Error ? parseError.message : String(parseError)}\nOutput: ${trimmedOutput}`);
      }
    } else {
      // No result variable - emit all output
      if (output.trim()) {
        session.output.push(output);
      }
    }

  } catch (error) {
    if (error instanceof Error && 'stderr' in error) {
      const stderr = (error as any).stderr?.toString() || '';
      throw new Error(`Python execution error: ${stderr || error.message}`);
    }
    throw new Error(`Python error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
