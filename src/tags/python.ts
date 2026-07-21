/**
 * <python> tag - execute Python code with access to session variables
 * Python code runs in subprocess as a leaf node (no child execution)
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { setVariable } from '../runtime/session.js';
import { execSync } from 'child_process';

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
  const pythonCode = element.text;

  if (!pythonCode || pythonCode.trim() === '') {
    throw new Error('<python> requires Python code as text content');
  }

  // Dedent the Python code to remove common leading whitespace
  const dedentedCode = dedent(pythonCode);

  if (session.debug) {
    console.error(`[PYTHON] Executing:\n${dedentedCode}\n`);
  }

  try {
    // Serialize session variables to JSON for Python access
    const varsForPython: Record<string, any> = {};
    for (const v of session.variables) {
      // Only pass JSON-serializable values
      try {
        JSON.stringify(v.value);
        varsForPython[v.name] = v.value;
        if (session.debug) {
          console.error(`[PYTHON] Adding variable '${v.name}' = ${JSON.stringify(v.value)}`);
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

    // Build Python script that:
    // 1. Loads variables into globals
    // 2. Executes user code
    // 3. Returns result as JSON (if result attribute specified)
    // Properly escape the JSON string for Python: backslashes first, then single quotes
    const jsonStr = JSON.stringify(varsForPython).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const pythonScript = `
import json
import sys

# Load session variables into global namespace
__dirac_vars = json.loads('''${jsonStr}''')
globals().update(__dirac_vars)

# Execute user code
${dedentedCode}

# Return result if specified
${resultVar ? `
try:
    __result = ${resultVar}
    print(json.dumps({"__dirac_result__": __result}))
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
        
        if (session.debug) {
          console.error(`[PYTHON] Stored variable '${resultVar}' = ${JSON.stringify(result.__dirac_result__)}`);
          console.error(`[PYTHON] Variable count: ${session.variables.length}`);
        }
      } catch (parseError) {
        throw new Error(`Failed to parse Python result: ${parseError instanceof Error ? parseError.message : String(parseError)}\nOutput: ${trimmedOutput}`);
      }
    } else if (session.debug) {
      console.error(`[PYTHON] Output:\n${output}`);
    }

  } catch (error) {
    if (error instanceof Error && 'stderr' in error) {
      const stderr = (error as any).stderr?.toString() || '';
      throw new Error(`Python execution error: ${stderr || error.message}`);
    }
    throw new Error(`Python error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
