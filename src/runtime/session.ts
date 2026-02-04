// Substitute both $var and ${var} in a string using session variables
export function substituteAttribute(session: DiracSession, value: any): string {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\$\{(\w+)\}/g, (match, varName) => {
      const v = getVariable(session, varName);
      return v !== undefined ? String(v) : match;
    })
    .replace(/\$(\w+)/g, (match, varName) => {
      const v = getVariable(session, varName);
      return v !== undefined ? String(v) : match;
    });
}
/**
 * Session management - maps to MASK session functions
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { OllamaProvider } from '../llm/ollama.js';
import type { DiracSession, DiracConfig, Variable, Subroutine, DiracElement } from '../types/index.js';

export function createSession(config: DiracConfig = {}): DiracSession {
  const anthropicKey =  process.env.ANTHROPIC_API_KEY;
  const openaiKey = config.apiKey || process.env.OPENAI_API_KEY;
  const llmProvider = config.llmProvider || process.env.LLM_PROVIDER;
  const ollamaModel = config.llmModel || process.env.LLM_MODEL || 'llama2';

  let llmClient: any;
  switch (llmProvider) {
    case 'ollama':
      llmClient = new OllamaProvider({ model: ollamaModel });
      break;
    case 'anthropic':
      if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY required for Anthropic provider');
      llmClient = new Anthropic({ apiKey: anthropicKey });
      break;
    case 'openai':
      if (!openaiKey) throw new Error('OPENAI_API_KEY required for OpenAI provider');
      llmClient = new OpenAI({ apiKey: openaiKey });
      break;
    default:
      throw new Error('No valid LLM provider configured. Set llmProvider in config or LLM_PROVIDER env.');
  }
  return {
    variables: [],
    subroutines: [],
    varBoundary: 0,
    subBoundary: 0,
    parameterStack: [],
    exceptions: [],
    currentException: {
      size: 0,
      exceptions: [],
    },
    output: [],
    llmClient,
    limits: {
      maxLLMCalls: config.maxLLMCalls || 100,
      currentLLMCalls: 0,
      maxDepth: config.maxDepth || 50,
      currentDepth: 0,
    },
    isReturn: false,
    isBreak: false,
    debug: config.debug || false,
  };
}

// Variable management (maps to var_info functions in MASK)

export function setVariable(session: DiracSession, name: string, value: any, visible: boolean = false): void {
  session.variables.push({
    name,
    value,
    visible,
    boundary: session.varBoundary,
    passby: 'value',
  });
}

export function getVariable(session: DiracSession, name: string): any {
  // Search from end (most recent) to beginning
  for (let i = session.variables.length - 1; i >= 0; i--) {
    if (session.variables[i].name === name) {
      return session.variables[i].value;
    }
  }
  return undefined;
}

export function hasVariable(session: DiracSession, name: string): boolean {
  return session.variables.some(v => v.name === name);
}

/**
 * Set boundary marker for local variables
 * Maps to var_info_set_boundary in MASK
 */
export function setBoundary(session: DiracSession): number {
  const oldBoundary = session.varBoundary;
  session.varBoundary = session.variables.length;
  return oldBoundary;
}

/**
 * Pop variables back to boundary (cleanup local scope)
 * Maps to var_info_pop_to_boundary in MASK
 */
export function popToBoundary(session: DiracSession): void {
  session.variables = session.variables.slice(0, session.varBoundary);
}

/**
 * Clean private variables but keep visible ones
 * Maps to var_info_clean_to_boundary in MASK
 */
export function cleanToBoundary(session: DiracSession): void {
  const kept: Variable[] = [];
  
  for (let i = 0; i < session.varBoundary; i++) {
    kept.push(session.variables[i]);
  }
  
  for (let i = session.varBoundary; i < session.variables.length; i++) {
    if (session.variables[i].visible) {
      kept.push(session.variables[i]);
    }
  }
  
  session.variables = kept;
  session.varBoundary = kept.length;
}

// Subroutine management (maps to subroutine functions in MASK)

export function registerSubroutine(
  session: DiracSession, 
  name: string, 
  element: DiracElement,
  description?: string,
  parameters?: any[],
  meta?: Record<string, string>
): void {
  session.subroutines.push({
    name,
    element,
    boundary: session.subBoundary,
    description,
    parameters,
    meta,
  });
}

export function getSubroutine(session: DiracSession, name: string): DiracElement | undefined {
  // Search from end (most recent) to beginning
  for (let i = session.subroutines.length - 1; i >= 0; i--) {
    if (session.subroutines[i].name === name) {
      return session.subroutines[i].element;
    }
  }
  return undefined;
}

export function setSubroutineBoundary(session: DiracSession): number {
  const oldBoundary = session.subBoundary;
  session.subBoundary = session.subroutines.length;
  return oldBoundary;
}

export function popSubroutinesToBoundary(session: DiracSession): void {
  session.subroutines = session.subroutines.slice(0, session.subBoundary);
}

export function cleanSubroutinesToBoundary(session: DiracSession): void {
  // For now, same as pop (visibility not implemented for subroutines yet)
  popSubroutinesToBoundary(session);
}

// Variable substitution (maps to var_replace functions in MASK)

export function substituteVariables(session: DiracSession, text: string): string {
  // Decode HTML entities only; do NOT substitute variables globally
  return text
    .replace(/&#10;/g, '\n')
    .replace(/&#13;/g, '\r')
    .replace(/&#9;/g, '\t')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// Output management

export function emit(session: DiracSession, content: string): void {
  session.output.push(content);
}

export function getOutput(session: DiracSession): string {
  return session.output.join('');
}

// Parameter stack (for subroutine calls)

export function pushParameters(session: DiracSession, params: DiracElement[]): void {
  session.parameterStack.push(params);
}

export function popParameters(session: DiracSession): DiracElement[] | undefined {
  return session.parameterStack.pop();
}

export function getCurrentParameters(session: DiracSession): DiracElement[] | undefined {
  return session.parameterStack[session.parameterStack.length - 1];
}

// Reflection/Introspection API

export function getAvailableSubroutines(session: DiracSession): Array<{
  name: string;
  description?: string;
  parameters?: Array<{
    name: string;
    type?: string;
    required?: boolean;
    description?: string;
    enum?: string[];
  }>;
}> {
  return session.subroutines.map(sub => ({
    name: sub.name,
    description: sub.description,
    parameters: sub.parameters,
    meta: sub.meta,
  }));
}

// Exception handling (for try/catch/throw)

export function throwException(session: DiracSession, name: string, dom: DiracElement): void {
  session.exceptions.push({
    name,
    dom,
    isBoundary: 0,
  });
}

export function setExceptionBoundary(session: DiracSession): void {
  const size = session.exceptions.length;
  if (size === 0) return;
  const top = session.exceptions[size - 1];
  top.isBoundary++;
}

export function unsetExceptionBoundary(session: DiracSession): void {
  const size = session.exceptions.length;
  if (size === 0) return;
  for (let i = size - 1; i >= 0; i--) {
    const exception = session.exceptions[i];
    if (exception.isBoundary > 0) {
      exception.isBoundary--;
      break;
    }
  }
}

export function lookupException(session: DiracSession, name: string): number {
  const size = session.exceptions.length;
  if (size === 0) return 0;
  
  let count = 0;
  for (let i = size - 1; i >= 0; i--) {
    const exception = session.exceptions[i];
    if (exception.isBoundary > 0) break;  // Stop at boundary
    
    if (exception.name === name) {
      // Add to current exception list
      session.currentException.exceptions.push(exception.dom);
      session.currentException.size++;
      count++;
    }
  }
  
  return count;
}

export function flushCurrentException(session: DiracSession): void {
  session.currentException.size = 0;
  session.currentException.exceptions = [];
}

export function getCurrentExceptions(session: DiracSession): DiracElement[] {
  return session.currentException.exceptions;
}
