/**
 * LLM Adapter - Auto-generate prompts and JSON→XML converters
 * from Dirac subroutine definitions
 */

import type { DiracSession } from '../types/index.js';
import { getAvailableSubroutines } from '../runtime/session.js';

export interface LLMPromptGenerator {
  generatePrompt(userInput: string): string;
  intentToXML(intent: any): string | null;
}

/**
 * Create LLM adapter from session's registered subroutines
 */
export function createLLMAdapter(session: DiracSession): LLMPromptGenerator {
  const subroutines = getAvailableSubroutines(session);
  
  // Build JSON schema from subroutines
  const actions = subroutines.map(s => `"${s.name}"`).join('|');
  
  // Build examples
  const examples = subroutines.slice(0, 3).map(sub => {
    if (!sub.parameters || sub.parameters.length === 0) {
      return `"${sub.name}" → {"action":"${sub.name}","params":{}}`;
    }
    
    const firstParam = sub.parameters[0];
    const exampleValue = firstParam.enum?.[0] || 'value';
    return `"call ${sub.name}" → {"action":"${sub.name}","params":{"${firstParam.name}":"${exampleValue}"}}`;
  }).join('\n');
  
  return {
    generatePrompt(userInput: string): string {
      return `You are a command parser. Convert user input to JSON.
Return ONLY valid JSON, no other text.

Format: {"action": ${actions}, "params": {}}

Examples:
${examples}

User: ${userInput}
JSON:`;
    },
    
    intentToXML(intent: any): string | null {
      if (!intent || !intent.action) return null;
      
      const sub = subroutines.find(s => s.name === intent.action);
      if (!sub) return null;
      
      const attrs: string[] = [`name="${sub.name}"`];
      
      // Map params to XML attributes
      if (sub.parameters) {
        for (const param of sub.parameters) {
          const value = intent.params?.[param.name];
          
          if (value != null) {
            // Validate enum if present
            if (param.enum && !param.enum.includes(value)) {
              return null;
            }
            attrs.push(`${param.name}="${value}"`);
          } else if (param.required) {
            return null; // Missing required parameter
          }
        }
      }
      
      return `<call ${attrs.join(' ')}/>`;
    }
  };
}

/**
 * Higher-level helper: execute user command via LLM
 */
export async function executeUserCommand(
  session: DiracSession,
  userInput: string,
  llmExecuteFn: (prompt: string) => Promise<string>
): Promise<{ success: boolean; xml?: string; error?: string }> {
  try {
    const adapter = createLLMAdapter(session);
    const prompt = adapter.generatePrompt(userInput);
    
    // Call LLM
    const llmResponse = await llmExecuteFn(prompt);
    
    // Parse JSON
    let jsonStr = llmResponse.trim();
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const intent = JSON.parse(jsonStr);
    
    // Convert to XML
    const xml = adapter.intentToXML(intent);
    
    if (!xml) {
      return { success: false, error: 'Could not convert intent to valid command' };
    }
    
    return { success: true, xml };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}
