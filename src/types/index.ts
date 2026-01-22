/**
 * Core types for Dirac interpreter
 * Directly based on MASK C implementation
 */

export interface DiracElement {
  tag: string;
  attributes: Record<string, string>;
  children: DiracElement[];
  text?: string;
}

/**
 * Variable info - maps to VarInfo in MASK
 */
export interface Variable {
  name: string;
  value: any;
  visible: boolean;
  boundary: number;  // scope boundary marker
  passby: 'value' | 'ref';
  refName?: string;  // for pass-by-reference
}

/**
 * Parameter metadata for introspection
 */
export interface ParameterMetadata {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
  enum?: string[];
}

/**
 * Subroutine info - maps to Subroutine in MASK
 */
export interface Subroutine {
  name: string;
  element: DiracElement;
  boundary: number;  // scope boundary marker
  extends?: string;  // parent subroutine
  // Metadata for reflection/introspection
  description?: string;
  parameters?: ParameterMetadata[];
}

/**
 * Execution context - maps to MaskSession in MASK
 */
export interface DiracSession {
  // Variable stack (all variables are on stack)
  variables: Variable[];
  
  // Subroutine registry
  subroutines: Subroutine[];
  
  // Scope boundaries (for cleanup)
  varBoundary: number;
  subBoundary: number;
  
  // Parameter stack (for subroutine calls)
  parameterStack: DiracElement[][];
  
  // Output buffer
  output: string[];
  
  // LLM client
  llmClient?: any;
  
  // Execution limits
  limits: {
    maxLLMCalls: number;
    currentLLMCalls: number;
    maxDepth: number;
    currentDepth: number;
  };
  
  // Control flow
  isReturn: boolean;
  isBreak: boolean;
  
  // Debugging
  debug: boolean;
  
  // Import tracking
  currentFile?: string;
  importedFiles?: Set<string>;
}

export interface DiracConfig {
  apiKey?: string;
  model?: string;
  debug?: boolean;
  maxLLMCalls?: number;
  maxDepth?: number;
  filePath?: string;  // Current file path for imports
}
