/**
 * <LLM> tag - THE INNOVATION
 * Execute LLM operation with recursive Dirac execution capability
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { setVariable, substituteVariables, substituteAttribute, emit, getVariable } from '../runtime/session.js';
import { integrate } from '../runtime/interpreter.js';
import { DiracParser } from '../runtime/parser.js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { OllamaProvider } from '../llm/ollama.js';
import { CustomLLMProvider } from '../llm/custom.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Dialog message structure
 */
interface DialogMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Prune dialog history for LLM call to reduce token usage
 * Strategy:
 * 1. Keep first system message (language intro)
 * 2. Remove redundant middle system messages 
 * 3. Keep recent user/assistant exchanges
 * 4. Ensure latest system message is present (current subroutine list)
 */
function pruneDialogForLLM(dialogHistory: DialogMessage[], keepRecentCount: number = 20): DialogMessage[] {
  if (dialogHistory.length <= keepRecentCount) {
    return dialogHistory; // No pruning needed
  }

  const firstSystemMsg = dialogHistory.find(m => m.role === 'system');
  const lastSystemMsg = dialogHistory.slice().reverse().find(m => m.role === 'system');
  
  // Get recent messages (last N)
  const recentMessages = dialogHistory.slice(-keepRecentCount);
  
  // Filter out redundant system messages from recent messages
  // Keep only the latest one (which should be at or near the end)
  const prunedRecent = recentMessages.filter(msg => {
    if (msg.role !== 'system') return true;
    // Keep this system message only if it's the last one
    return msg === lastSystemMsg;
  });
  
  // Build final pruned history
  const result: DialogMessage[] = [];
  
  // Add first system message if not already in recent
  if (firstSystemMsg && !prunedRecent.includes(firstSystemMsg)) {
    result.push(firstSystemMsg);
  }
  
  // Add pruned recent messages
  result.push(...prunedRecent);
  
  // Ensure latest system message is at the end (right before current query)
  // Remove it from middle if present and add at end
  if (lastSystemMsg && lastSystemMsg !== result[result.length - 1]) {
    const filtered = result.filter(m => m !== lastSystemMsg);
    filtered.push(lastSystemMsg);
    return filtered;
  }
  
  return result;
}

/**
 * Create an LLM client for a specific provider
 */
function createLLMClient(provider: string, model?: string): any {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const ollamaModel = model || process.env.LLM_MODEL || 'llama2';
  const customBaseUrl = process.env.CUSTOM_LLM_URL || 'http://localhost:5001';

  switch (provider) {
    case 'ollama':
      return new OllamaProvider({ model: ollamaModel });
    case 'anthropic':
      if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY required for Anthropic provider');
      return new Anthropic({ apiKey: anthropicKey });
    case 'openai':
      if (!openaiKey) throw new Error('OPENAI_API_KEY required for OpenAI provider');
      return new OpenAI({ apiKey: openaiKey });
    case 'custom':
      return new CustomLLMProvider({ baseUrl: customBaseUrl, model: ollamaModel });
    default:
      throw new Error(`Unknown LLM provider: ${provider}. Use 'ollama', 'anthropic', 'openai', or 'custom'.`);
  }
}

/**
 * Dump LLM-generated subroutines to ~/.dirac/lib/TIMESTAMP/
 * Each subroutine is saved as a separate file named by subroutine name
 */
function dumpGeneratedSubroutines(session: DiracSession, diracCode: string, userPrompt: string): void {
  try {
    // Parse the generated code to find subroutines
    const parser = new DiracParser();
    const ast = parser.parse(diracCode);
    
    // Find all subroutine elements
    const subroutines: DiracElement[] = [];
    
    function findSubroutines(element: DiracElement): void {
      if (element.tag === 'subroutine') {
        subroutines.push(element);
      }
      if (element.children) {
        for (const child of element.children) {
          findSubroutines(child);
        }
      }
    }
    
    findSubroutines(ast);
    
    if (subroutines.length === 0) {
      return; // No subroutines to dump
    }
    
    // Create timestamped directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: 2026-03-12T14-30-45
    const dumpDir = path.join(os.homedir(), '.dirac', 'lib', timestamp);
    
    if (!fs.existsSync(dumpDir)) {
      fs.mkdirSync(dumpDir, { recursive: true });
    }
    
    // Serialize and save each subroutine
    for (const sub of subroutines) {
      const subName = sub.attributes.name || 'unnamed';
      const filePath = path.join(dumpDir, `${subName}.di`);
      
      // Serialize the subroutine element back to XML
      const xml = serializeElement(sub, userPrompt);
      
      fs.writeFileSync(filePath, xml, 'utf-8');
      
      if (session.debug) {
        console.error(`[LLM] Dumped subroutine '${subName}' to: ${filePath}`);
      }
    }
    
    if (session.debug) {
      console.error(`[LLM] Dumped ${subroutines.length} subroutine(s) to: ${dumpDir}`);
    }
  } catch (error) {
    // Don't fail the whole operation if dump fails
    if (session.debug) {
      console.error(`[LLM] Failed to dump subroutines: ${error}`);
    }
  }
}

/**
 * Serialize a DiracElement back to XML with metadata comment
 */
function serializeElement(element: DiracElement, prompt: string): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [];
  
  // Add metadata comment
  lines.push('<!--');
  lines.push(`  Created: ${timestamp}`);
  lines.push(`  Generated by: LLM`);
  lines.push(`  Prompt: ${prompt.replace(/-->/g, '--&gt;')}`);
  lines.push('-->');
  lines.push('');
  
  // Serialize the element
  function serialize(el: DiracElement, indent: string = ''): void {
    if (el.text && !el.tag) {
      lines.push(indent + el.text);
      return;
    }
    
    if (!el.tag) return;
    
    // Opening tag
    let tag = `${indent}<${el.tag}`;
    
    // Add attributes
    if (el.attributes) {
      for (const [key, value] of Object.entries(el.attributes)) {
        tag += ` ${key}="${value.replace(/"/g, '&quot;')}"`;
      }
    }
    
    // Self-closing or with content
    if (!el.children || el.children.length === 0) {
      if (el.text) {
        lines.push(tag + '>');
        lines.push(indent + '  ' + el.text);
        lines.push(`${indent}</${el.tag}>`);
      } else {
        lines.push(tag + ' />');
      }
    } else {
      lines.push(tag + '>');
      for (const child of el.children) {
        serialize(child, indent + '  ');
      }
      lines.push(`${indent}</${el.tag}>`);
    }
  }
  
  serialize(element);
  return lines.join('\n');
}

/**
 * Simple serialization without metadata - for showing corrected code
 */
function serializeSimple(el: DiracElement, indent: string, lines: string[]): void {
  if (el.text && !el.tag) {
    const trimmed = el.text.trim();
    if (trimmed) {
      lines.push(indent + trimmed);
    }
    return;
  }
  
  if (!el.tag) return;
  
  // Opening tag
  let tag = `${indent}<${el.tag}`;
  
  // Add attributes
  if (el.attributes) {
    for (const [key, value] of Object.entries(el.attributes)) {
      tag += ` ${key}="${value.replace(/"/g, '&quot;')}"`;
    }
  }
  
  // Self-closing or with content
  if (!el.children || el.children.length === 0) {
    if (el.text) {
      lines.push(tag + '>');
      lines.push(indent + '  ' + el.text);
      lines.push(`${indent}</${el.tag}>`);
    } else {
      lines.push(tag + ' />');
    }
  } else {
    lines.push(tag + '>');
    for (const child of el.children) {
      serializeSimple(child, indent + '  ', lines);
    }
    lines.push(`${indent}</${el.tag}>`);
  }
}


export async function executeLLM(session: DiracSession, element: DiracElement): Promise<void> {
  if (!session.llmClient) {
    throw new Error('<llm> tag requires LLM configuration. Set LLM_PROVIDER (ollama/anthropic/openai/custom) and appropriate API keys in environment or config.yml');
  }

  // Helper function to call Anthropic API with proper system message handling
  const callAnthropic = async (client: any, model: string, maxTokens: number, temperature: number, messages: DialogMessage[]) => {
    const systemMessages = messages.filter(m => m.role === 'system');
    const userAssistantMessages = messages.filter(m => m.role !== 'system');
    const systemContent = systemMessages.map(m => m.content).join('\n\n');
    
    const anthropicParams: any = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: userAssistantMessages,
    };
    
    if (systemContent) {
      anthropicParams.system = systemContent;
    }
    
    const response = await client.messages.create(anthropicParams);
    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  };

  // Check limits
  if (session.limits.currentLLMCalls >= session.limits.maxLLMCalls) {
    throw new Error('Maximum LLM calls exceeded');
  }

  session.limits.currentLLMCalls++;

  // Support per-call provider switching via provider attribute
  const requestedProvider = element.attributes.provider;
  let llmClient = session.llmClient;
  
  if (requestedProvider) {
    // Create a temporary client for this specific provider
    const requestedModel = element.attributes.model || process.env.DEFAULT_MODEL;
    llmClient = createLLMClient(requestedProvider, requestedModel);
    if (session.debug) {
      console.error(`[LLM] Switching to provider: ${requestedProvider}`);
    }
  }
  
  if (!llmClient) {
    throw new Error('No LLM provider configured. Set provider attribute or configure session with LLM_PROVIDER.');
  }

  // Detect provider from client type
  const providerName = llmClient.constructor.name;
  const isOpenAI = providerName === 'OpenAI';
  const isOllama = providerName === 'OllamaProvider';
  const isCustom = providerName === 'CustomLLMProvider';
  const defaultModel = isOpenAI
    ? 'gpt-4.1-2025-04-14'
    : isOllama
      ? 'llama2'
      : isCustom
        ? 'custom-model'
        : 'claude-sonnet-4-5-20250929';


  const model = element.attributes.model || process.env.DEFAULT_MODEL || defaultModel;

  const outputVar = element.attributes.output;
  const contextVar = element.attributes.context;
  const saveDialog = element.attributes['save-dialog'] === 'true'; // NEW: Enable persistent dialog history
  const executeMode = element.attributes.execute === 'true'; // NEW: seamless execution mode
  const temperature = parseFloat(element.attributes.temperature || '1.0');
  const maxTokens = parseInt(element.attributes.maxTokens || '4096', 10);
  const showMode = element.attributes.show || 'all'; // 'all' shows all subroutines (default), 'boundary' limits to current scope

  // Build prompt from children or text
  let userPrompt = '';
  if (element.children.length > 0) {
    // Execute children to build prompt
    const beforeOutput = session.output.length;
    for (const child of element.children) {
      await integrate(session, child);
    }
    // Collect output from children
    const childOutput = session.output.slice(beforeOutput);
    userPrompt = childOutput.join('').trim();
    // Remove child output from main output
    session.output = session.output.slice(0, beforeOutput);
  } else if (element.text) {
    userPrompt = substituteVariables(session, element.text).trim();
  } else {
    throw new Error('<LLM> requires prompt content');
  }

  // FIFO dialog history support
  let dialogHistory: DialogMessage[] = [];
  let hasExistingDialog = false;
  if (contextVar || saveDialog) {
    const varName = contextVar || '__llm_dialog__';
    const existing = getVariable(session, varName);
    if (session.debug) {
      console.error(`[LLM] Checking for dialog context in variable: ${varName}`);
      console.error(`[LLM] Existing value type: ${Array.isArray(existing) ? 'array' : typeof existing}`);
      if (Array.isArray(existing)) {
        console.error(`[LLM] Existing dialog length: ${existing.length} messages`);
      }
    }
    if (Array.isArray(existing)) {
      dialogHistory = [...existing];
      hasExistingDialog = dialogHistory.length > 0;
    } else if (existing) {
      // Try to parse as JSON string first (new format)
      try {
        const parsed = JSON.parse(String(existing));
        if (Array.isArray(parsed)) {
          dialogHistory = parsed;
          hasExistingDialog = dialogHistory.length > 0;
        } else {
          // Not an array, treat as system message
          dialogHistory = [{ role: 'system', content: String(existing) }];
          hasExistingDialog = true;
        }
      } catch {
        // Not JSON, treat as system message
        dialogHistory = [{ role: 'system', content: String(existing) }];
        hasExistingDialog = true;
      }
    }
  }

  const noExtra = element.attributes.noextra === 'true';
  let systemPrompt = '';
  let currentUserPrompt = userPrompt;
  
  if (!noExtra) {
    // Reflect subroutines for system prompt
    const { getAvailableSubroutines } = await import('../runtime/session.js');
    const allSubroutines = getAvailableSubroutines(session);
    
    if (session.debug) {
      console.error(`[LLM] Total subroutines from session: ${allSubroutines.length}`);
      console.error(`[LLM] Has existing dialog: ${hasExistingDialog}`);
    }
    
    // Filter based on show mode and boundaries
    let boundaryFilteredSubroutines = allSubroutines;
    if (showMode === 'boundary') {
      // Find the current boundary in the subroutine stack
      const currentBoundary = session.subBoundary;
      
      if (session.debug) {
        console.error(`[LLM] Current boundary: ${currentBoundary}`);
        console.error(`[LLM] All subroutines before boundary filter:`, 
          allSubroutines.slice(0, 5).map(s => ({ name: s.name, boundary: (s as any).boundary })));
      }
      
      boundaryFilteredSubroutines = allSubroutines.filter(sub => {
        // Keep only subroutines registered at or before the current boundary
        // These are from the current scope and parent scopes
        return (sub as any).boundary <= currentBoundary;
      });
      
      if (session.debug && allSubroutines.length !== boundaryFilteredSubroutines.length) {
        console.error(`[LLM] Filtered to boundary ${currentBoundary}: ${boundaryFilteredSubroutines.length}/${allSubroutines.length} subroutines visible`);
      }
    }
    
    // Filter out subroutines with hide-from-llm metadata
    const subroutines = boundaryFilteredSubroutines.filter(sub => {
      const hideMeta = (sub as any).meta?.['hide-from-llm'];
      return hideMeta !== 'true' && hideMeta !== true;
    });
    
    if (session.debug) {
      console.error(`[LLM] After hide-from-llm filter: ${subroutines.length} subroutines`);
      console.error('[LLM] Subroutines available at prompt composition:',
        subroutines.map(s => ({ name: s.name, description: s.description, parameters: s.parameters })));
      if (allSubroutines.length !== subroutines.length) {
        console.error(`[LLM] Filtered out ${allSubroutines.length - subroutines.length} subroutine(s) (boundary + hide-from-llm)`);
      }
    }
    
    // If we have existing dialog history, only send updated subroutine list
    // Otherwise, send full system prompt with Dirac introduction
    if (hasExistingDialog && (contextVar || saveDialog)) {
      // Continuing a conversation - add updated subroutines as system message
      // Use simple prompt for custom provider (fine-tuned), detailed for others
      if (isCustom) {
        // Simple prompt for fine-tuned custom model
        systemPrompt = 'Available tags:';
        for (const sub of subroutines) {
          systemPrompt += `\n- ${sub.name}`;
          if (sub.description) {
            systemPrompt += `: ${sub.description}`;
          }
        }
      } else {
        // Detailed prompt for public models
        systemPrompt = 'Updated available Dirac XML tags:';
        for (const sub of subroutines) {
          systemPrompt += `\n- ${sub.name} : ${sub.description || ''}`;
          systemPrompt += `\n\tEx: <${sub.name}`;
          if (sub.parameters && sub.parameters.length > 0) {
            for (const p of sub.parameters) {
              systemPrompt += ` ${p.name}="${(p as any).example || 'string'}"`;
            }
          }
          let example = (sub as any).meta?.body?.example || '';
          example = example.replace(/&quot;/g, '"').replace(/&#58;/g, ':'); 
          systemPrompt += '>'+example+'</' + sub.name + '>';
        }
      }
      
      // Add as separate system message before the user's new message
      dialogHistory.push({ role: 'system', content: systemPrompt });
      
      // User prompt stays clean
      currentUserPrompt = userPrompt;
      
      if (session.debug || process.env.DIRAC_LOG_PROMPT === '1') {
        console.error('[LLM] Continuing dialog with updated subroutines (as system message)\n');
      }
    } else {
      // First call - send full system prompt
      // Use simple prompt for custom provider (fine-tuned), detailed for others
      if (isCustom) {
        // Simple prompt for fine-tuned custom model
        systemPrompt = `Dirac is an XML-based language for defining and calling subroutines.

Example:
\`\`\`xml
<subroutine name="greet" param-name="string">
  <output>Hello, <variable name="name"/>!</output>
</subroutine>
<greet name="Alice" />
\`\`\`

Available tags:`;
        for (const sub of subroutines) {
          systemPrompt += `\n- ${sub.name}`;
          if (sub.description) {
            systemPrompt += `: ${sub.description}`;
          }
        }
      } else {
        // Detailed prompt for public models
        systemPrompt = `Dirac is a XML-based language. To define a subroutine with parameters:

\`\`\`xml
<subroutine name="greet" param-name="string">
  <!-- param-name defines a parameter called "name" -->
  <!-- Access it inside using: <variable name="name"/> -->
  <output>Hello, <variable name="name"/>!</output>
</subroutine>
\`\`\`

To call it:
\`\`\`xml
<greet name="Alice" />
<!-- Use just the parameter name (name), NOT param-name -->
\`\`\`

CRITICAL: When defining parameters:
- Use param-NAME="type" format where NAME is the parameter's name
- Example: param-username="string" means parameter is called "username"
- Inside the subroutine, access with: <variable name="username"/>
- When calling: <mytag username="John" /> (use parameter name directly)
`;
        systemPrompt += 'Now, You are an expert Dirac XML code generator.\nAllowed Dirac XML tags (use ONLY these tags):';
        for (const sub of subroutines) {
          systemPrompt += `\n- ${sub.name} : ${sub.description || ''}`;
          systemPrompt += `\n\tEx: <${sub.name}`;
          if (sub.parameters && sub.parameters.length > 0) {
            for (const p of sub.parameters) {
              systemPrompt += ` ${p.name}="${(p as any).example || 'string'}"`;
            }
          }
          let example = (sub as any).meta?.body?.example || '';
          example = example.replace(/&quot;/g, '"').replace(/&#58;/g, ':'); 
          systemPrompt += '>'+example+'</' + sub.name + '>';
        }
        systemPrompt += '\n\nIMPORTANT INSTRUCTIONS:';
        systemPrompt += '\n1. Output ONLY valid XML tags from the list above';
        systemPrompt += '\n2. Do NOT include any explanations, descriptions, or extra text';
        systemPrompt += '\n3. Do NOT use bullet points or formatting - just pure XML';
        systemPrompt += '\n4. Do NOT invent tags - only use tags from the list above';
        systemPrompt += '\n5. Start your response directly with the XML tag (e.g., <add ...>)';
        systemPrompt += '\n\nDouble-check: Does your response contain ONLY XML tags? If not, remove all non-XML text.';
      }
      
      // For first call, add system prompt as separate system message
      if (dialogHistory.length === 0) {
        dialogHistory.push({ role: 'system', content: systemPrompt });
      }
      
      currentUserPrompt = userPrompt;
      
      if (session.debug || process.env.DIRAC_LOG_PROMPT === '1') {
        console.error('[LLM] First call - sending full system prompt\n');
      }
    }
  }

  // Add user message to dialog history (for full audit log)
  dialogHistory.push({ role: 'user', content: currentUserPrompt });
  
  // Prune dialog history for LLM call (keep full history for audit)
  const prunedDialogHistory = pruneDialogForLLM(dialogHistory, 20); // Keep last 20 messages
  
  if (session.debug) {
    console.error(`[LLM] Calling ${model}`);
    console.error(`[LLM] Dialog history length: ${dialogHistory.length} messages (full), ${prunedDialogHistory.length} messages (pruned)`);
    console.error(`[LLM] Has existing dialog: ${hasExistingDialog}`);
  }
  
  try {
    let result: string;
    if (isOpenAI) {
      // Call OpenAI API with pruned dialog history
      const response = await llmClient.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: prunedDialogHistory,
      });
      result = response.choices[0]?.message?.content || '';
    } else if (isOllama) {
      // Call OllamaProvider with dialog history as joined string
      const ollamaPrompt = prunedDialogHistory.map((m: DialogMessage) => `${m.role.charAt(0).toUpperCase() + m.role.slice(1)}: ${m.content}`).join('\n');
      result = await llmClient.complete(ollamaPrompt, {
        model,
        temperature,
        max_tokens: maxTokens,
      });
    } else if (isCustom) {
      // Call CustomLLMProvider with dialog history
      const customPrompt = prunedDialogHistory.map((m: DialogMessage) => `${m.role}: ${m.content}`).join('\n');
      result = await llmClient.complete(customPrompt, {
        model,
        temperature,
        max_tokens: maxTokens,
        messages: prunedDialogHistory,
      });
    } else {
      // Call Anthropic API - use helper function
      result = await callAnthropic(llmClient, model, maxTokens, temperature, prunedDialogHistory);
    }
    
    if (session.debug) {
      console.error(`[LLM] Response length: ${result.length}`);
      console.error(`[LLM] Generated code:\n${result}\n`);
    }
    
    // After LLM call, append assistant response to dialogHistory and update context variable
    dialogHistory.push({ role: 'assistant', content: result });
    const varName = contextVar || (saveDialog ? '__llm_dialog__' : null);
    if (varName) {
      if (session.debug) {
        console.error(`[LLM] Saving dialog history (${dialogHistory.length} messages) to: ${varName}`);
      }
      setVariable(session, varName, JSON.stringify(dialogHistory), true);
    }

    // Store in variable if requested
    if (outputVar) {
      setVariable(session, outputVar, result, false);
    } else if (executeMode) {
      // NEW: Execute mode - parse and interpret LLM response as Dirac code
      const validateTags = element.attributes['validate'] === 'true';
      const autocorrect = element.attributes['autocorrect'] === 'true';
      const maxRetries = parseInt(element.attributes['max-retries'] || '0', 10);
      const feedbackMode = element.attributes['feedback'] === 'true';
      const confirmCorrections = element.attributes['confirm-corrections'] === 'true';
      
      // Always log validation settings (not just in debug mode)
      console.error(`[LLM] Execute mode - validate: ${validateTags}, autocorrect: ${autocorrect}, feedback: ${feedbackMode}, confirm-corrections: ${confirmCorrections}, debug: ${session.debug}`);
      
      // Support variable substitution in max-iterations attribute
      const maxIterationsAttr = substituteAttribute(session, element.attributes['max-iterations'] || '3');
      const maxIterations = parseInt(maxIterationsAttr, 10);
      
      const replaceTick = element.attributes['replace-tick'] === 'true';
      
      if (session.debug) {
        console.error(`[LLM] Executing response as Dirac code:\n${result}\n`);
        if (validateTags) {
          console.error(`[LLM] Tag validation enabled (autocorrect: ${autocorrect}, max-retries: ${maxRetries})`);
        }
        if (feedbackMode) {
          console.error(`[LLM] Feedback mode enabled (max iterations: ${maxIterations})`);
        }
      }

      // Feedback loop: execute, capture output, send back to LLM, repeat
      let iteration = 0;
      
      while (iteration < maxIterations && (iteration === 0 || feedbackMode)) {
        iteration++;
        if (session.debug && feedbackMode) {
          console.error(`[LLM] Feedback iteration ${iteration}/${maxIterations}`);
        }
        
        // Track corrections for feedback
        let correctionMessages: string[] = [];
        let hasTagCorrections = false; // Track if there were actual tag/attribute corrections (not just warnings)
        
        // Only replace triple backtick code blocks if replace-tick="true" is set
        let diracCode = result.trim();
        if (replaceTick && diracCode.startsWith('```')) {
          // Check for bash, xml, html, dirac, or no language
          const match = diracCode.match(/^```(\w+)?\n?/m);
          if (match && match[1] === 'bash') {
            // Find closing triple backticks
            const endIdx = diracCode.indexOf('```', 3);
            let bashContent = diracCode.slice(match[0].length, endIdx).trim();
            diracCode = `<system>${bashContent}</system>`;
          } else {
            // Remove opening and closing backticks for xml/html/dirac/none
            diracCode = diracCode.replace(/^```(?:xml|html|dirac)?\n?/m, '').replace(/\n?```$/m, '').trim();
          }
        }
        
        // Capture output before execution (for feedback)
        const outputBefore = feedbackMode ? session.output.slice() : [];
        
        try {
          // Parse the LLM's output as Dirac code
          console.error(`[LLM] Iteration ${iteration}: Parsing LLM response`);
          const parser = new DiracParser();
          let dynamicAST = parser.parse(diracCode);
          console.error(`[LLM] Iteration ${iteration}: Parse successful`);
          
          // Validate tags if requested
          if (validateTags) {
            console.error(`[LLM] Iteration ${iteration}: Starting validation (autocorrect: ${autocorrect}, deepValidation: true)`);
            if (session.debug) {
              console.error(`[LLM] Validation enabled, autocorrect: ${autocorrect}`);
            }
            const { validateDiracCode, applyCorrectedTags } = await import('../utils/tag-validator.js');
            let validation = await validateDiracCode(session, dynamicAST, { autocorrect, deepValidation: true });
            console.error(`[LLM] Iteration ${iteration}: Validation complete - valid: ${validation.valid}, errors: ${validation.errorMessages.length}`);
            
            if (session.debug) {
              console.error(`[LLM] Validation result: valid=${validation.valid}, results count=${validation.results.length}`);
              if (validation.results.length > 0) {
                console.error(`[LLM] Validation details:`, validation.results.map(r => ({
                  tag: r.tagName,
                  originalTag: r.originalTag,
                  corrected: r.corrected,
                  attrCorrections: r.attributeCorrections,
                  warnings: r.warnings
                })));
              }
            }
            
            // Apply auto-corrections immediately after first validation (if enabled)
            if (autocorrect) {
              console.error(`[LLM] Applying corrections from initial ${validation.results.length} validation results`);
              
              // Collect all correction/warning messages from FIRST validation
              for (const result of validation.results) {
                if (result.corrected) {
                  hasTagCorrections = true; // Mark that we had actual corrections
                  correctionMessages.push(`Auto-corrected: <${result.originalTag}> → <${result.tagName}> (similarity: ${result.similarity?.toFixed(2)})`);
                }
                if (result.warnings.length > 0) {
                  // Filter out scope warnings from correction messages (they're informational only)
                  const nonScopeWarnings = result.warnings.filter(w => !w.startsWith('Scope:'));
                  if (nonScopeWarnings.length > 0) {
                    hasTagCorrections = true; // Non-scope warnings are actual issues
                    correctionMessages.push(...nonScopeWarnings);
                  }
                }
              }
              
              console.error('[LLM] Initial correction messages collected:', correctionMessages.length);
              if (correctionMessages.length > 0) {
                console.error('[LLM] Corrections:', correctionMessages.join('; '));
              }
              
              // Apply the corrections to the AST
              dynamicAST = applyCorrectedTags(dynamicAST, validation.results);
              console.error('[LLM] Applied initial auto-corrections to AST');
              
              // Re-validate the corrected AST to check if corrections fixed all issues
              validation = await validateDiracCode(session, dynamicAST, { autocorrect: false, deepValidation: true });
              console.error(`[LLM] Re-validation after corrections: valid=${validation.valid}`);
            }
            
            let retryCount = 0;
            
            console.error(`[LLM] Iteration ${iteration}: Entering retry loop (validation.valid: ${validation.valid}, maxRetries: ${maxRetries})`);
            
            while (!validation.valid && retryCount < maxRetries) {
              retryCount++;
              console.error(`[LLM] Iteration ${iteration}: Retry ${retryCount}/${maxRetries} - validation failed with errors:`, validation.errorMessages);
              if (session.debug) {
                console.error(`[LLM] Validation failed (attempt ${retryCount}/${maxRetries}):`, validation.errorMessages);
              }
              
              // Build error feedback for LLM
              const errorFeedback = validation.errorMessages.join('\n');
              const retryPrompt = `Your previous response had the following errors:\n${errorFeedback}\n\nPlease fix these errors and generate valid Dirac XML again. Remember to only use the allowed tags.`;
              
              // Add error feedback to dialog history
              dialogHistory.push({ role: 'user', content: retryPrompt });
              
              // Retry LLM call
              if (isOpenAI) {
                const response = await llmClient.chat.completions.create({
                  model,
                  max_tokens: maxTokens,
                  temperature,
                  messages: dialogHistory,
                });
                result = response.choices[0]?.message?.content || '';
              } else if (isOllama) {
                const ollamaPrompt = dialogHistory.map(m => `${m.role.charAt(0).toUpperCase() + m.role.slice(1)}: ${m.content}`).join('\n');
                result = await llmClient.complete(ollamaPrompt, {
                  model,
                  temperature,
                  max_tokens: maxTokens,
                });
              } else if (isCustom) {
                const customPrompt = dialogHistory.map(m => `${m.role}: ${m.content}`).join('\n');
                result = await llmClient.complete(customPrompt, {
                  model,
                  temperature,
                  max_tokens: maxTokens,
                  messages: dialogHistory,
                });
              } else {
                result = await callAnthropic(llmClient, model, maxTokens, temperature, dialogHistory);
              }
              
              // Add new response to dialog history
              dialogHistory.push({ role: 'assistant', content: result });
              
              // Update context variable if present (store as JSON string, not object)
              if (contextVar) {
                setVariable(session, contextVar, JSON.stringify(dialogHistory), true);
              } else if (saveDialog) {
                setVariable(session, '__llm_dialog__', JSON.stringify(dialogHistory), true);
              }
              
              if (session.debug) {
                console.error(`[LLM] Retry ${retryCount} response:\n${result}\n`);
              }
              
              // Clean up and parse the new response
              diracCode = result.trim();
              if (replaceTick && diracCode.startsWith('```')) {
                const match = diracCode.match(/^```(\w+)?\n?/m);
                if (match && match[1] === 'bash') {
                  const endIdx = diracCode.indexOf('```', 3);
                  let bashContent = diracCode.slice(match[0].length, endIdx).trim();
                  diracCode = `<system>${bashContent}</system>`;
                } else {
                  diracCode = diracCode.replace(/^```(?:xml|html|dirac)?\n?/m, '').replace(/\n?```$/m, '').trim();
                }
              }
              
              dynamicAST = parser.parse(diracCode);
              validation = await validateDiracCode(session, dynamicAST, { autocorrect, deepValidation: true });
            }
            
            if (!validation.valid) {
              console.error(`[LLM] Iteration ${iteration}: VALIDATION FAILED after ${maxRetries} retries. Throwing error.`);
              throw new Error(`Tag validation failed after ${maxRetries} retries:\n${validation.errorMessages.join('\n')}`);
            }
            
            console.error(`[LLM] Iteration ${iteration}: Validation passed, checking for corrections (hasTagCorrections: ${hasTagCorrections}, correctionMessages: ${correctionMessages.length})`);
            
            // Add correction feedback to dialog after all retries (if any corrections were made)
            if (hasTagCorrections && correctionMessages.length > 0 && feedbackMode) {
              console.error(`[LLM] Iteration ${iteration}: Has tag corrections, preparing feedback (confirmCorrections: ${confirmCorrections})`);
              // Serialize only the children (skip DIRAC-ROOT wrapper and metadata)
              const correctedCodeLines: string[] = [];
              for (const child of dynamicAST.children) {
                if (child.tag && child.tag !== 'DIRAC-ROOT') {
                  serializeSimple(child, '', correctedCodeLines);
                }
              }
              const correctedCode = correctedCodeLines.join('\n');
              
              // If confirm-corrections is enabled, ask LLM to confirm before executing
              if (confirmCorrections) {
                const correctionFeedback = `System: Your submitted code had errors and was auto-corrected:\n${correctionMessages.join('\n')}\n\nCorrected code:\n\`\`\`xml\n${correctedCode}\n\`\`\`\n\nIf you resubmit this corrected code, I will execute it for you. Please review and resubmit the corrected code, or provide a different solution.`;
                dialogHistory.push({ role: 'user', content: correctionFeedback });
                
                // Update dialog variable immediately
                if (contextVar) {
                  setVariable(session, contextVar, JSON.stringify(dialogHistory), true);
                } else if (saveDialog) {
                  setVariable(session, '__llm_dialog__', JSON.stringify(dialogHistory), true);
                }
                
                console.error('[LLM] Corrections made - waiting for LLM confirmation (not executing yet)');
                
                // Call LLM to get confirmation/corrected response
                if (isOpenAI) {
                  const response = await llmClient.chat.completions.create({
                    model,
                    max_tokens: maxTokens,
                    temperature,
                    messages: dialogHistory,
                  });
                  result = response.choices[0]?.message?.content || '';
                } else if (isOllama) {
                  const ollamaPrompt = dialogHistory.map(m => `${m.role.charAt(0).toUpperCase() + m.role.slice(1)}: ${m.content}`).join('\n');
                  result = await llmClient.complete(ollamaPrompt, {
                    model,
                    temperature,
                    max_tokens: maxTokens,
                  });
                } else if (isCustom) {
                  const customPrompt = dialogHistory.map(m => `${m.role}: ${m.content}`).join('\n');
                  result = await llmClient.complete(customPrompt, {
                    model,
                    temperature,
                    max_tokens: maxTokens,
                    messages: dialogHistory,
                  });
                } else {
                  result = await callAnthropic(llmClient, model, maxTokens, temperature, dialogHistory);
                }
                
                // Add response to dialog history
                dialogHistory.push({ role: 'assistant', content: result });
                
                // Update dialog variable
                if (contextVar) {
                  setVariable(session, contextVar, JSON.stringify(dialogHistory), true);
                } else if (saveDialog) {
                  setVariable(session, '__llm_dialog__', JSON.stringify(dialogHistory), true);
                }
                
                console.error(`[LLM] LLM confirmation response:\n${result}\n`);
                
                // Continue to next iteration to process the LLM's corrected response
                continue;
              } else {
                // Default behavior: execute immediately and show what was executed
                const correctionFeedback = `System: Auto-corrections applied:\n${correctionMessages.join('\n')}\n\nActual code executed:\n\`\`\`xml\n${correctedCode}\n\`\`\``;
                dialogHistory.push({ role: 'user', content: correctionFeedback });
                
                // Update dialog variable immediately
                if (contextVar) {
                  setVariable(session, contextVar, JSON.stringify(dialogHistory), true);
                } else if (saveDialog) {
                  setVariable(session, '__llm_dialog__', JSON.stringify(dialogHistory), true);
                }
              }
            }
          }
          
          console.error(`[LLM] Iteration ${iteration}: About to execute code`);
          
          // Execute the validated (and possibly corrected) code
          let executionError: string | null = null;
          try {
            console.error(`[LLM] Iteration ${iteration}: Calling integrate()`);
            await integrate(session, dynamicAST);
            console.error(`[LLM] Iteration ${iteration}: integrate() completed successfully`);
          } catch (execError) {
            executionError = execError instanceof Error ? execError.message : String(execError);
            console.error(`[LLM] Iteration ${iteration}: EXECUTION ERROR: ${executionError}`);
            console.error(`[LLM] Execution error: ${executionError}`);
            
            // In feedback mode, add execution error to dialog and get LLM to fix it
            if (feedbackMode && iteration < maxIterations) {
              const errorFeedback = `System: Your code executed but encountered a runtime error:\n${executionError}\n\nPlease fix the error and try again.`;
              dialogHistory.push({ role: 'user', content: errorFeedback });
              
              // Update dialog variable
              if (contextVar) {
                setVariable(session, contextVar, JSON.stringify(dialogHistory), true);
              } else if (saveDialog) {
                setVariable(session, '__llm_dialog__', JSON.stringify(dialogHistory), true);
              }
              
              // Call LLM to get fixed code
              if (isOpenAI) {
                const response = await llmClient.chat.completions.create({
                  model,
                  max_tokens: maxTokens,
                  temperature,
                  messages: dialogHistory,
                });
                result = response.choices[0]?.message?.content || '';
              } else if (isOllama) {
                const ollamaPrompt = dialogHistory.map(m => `${m.role.charAt(0).toUpperCase() + m.role.slice(1)}: ${m.content}`).join('\n');
                result = await llmClient.complete(ollamaPrompt, {
                  model,
                  temperature,
                  max_tokens: maxTokens,
                });
              } else if (isCustom) {
                const customPrompt = dialogHistory.map(m => `${m.role}: ${m.content}`).join('\n');
                result = await llmClient.complete(customPrompt, {
                  model,
                  temperature,
                  max_tokens: maxTokens,
                  messages: dialogHistory,
                });
              } else {
                result = await callAnthropic(llmClient, model, maxTokens, temperature, dialogHistory);
              }
              
              // Add LLM's response to dialog
              dialogHistory.push({ role: 'assistant', content: result });
              
              // Update dialog variable again with LLM response
              if (contextVar) {
                setVariable(session, contextVar, JSON.stringify(dialogHistory), true);
              } else if (saveDialog) {
                setVariable(session, '__llm_dialog__', JSON.stringify(dialogHistory), true);
              }
              
              // Continue to next iteration with new response
              continue;
            } else {
              // Not in feedback mode or max iterations reached, re-throw
              throw execError;
            }
          }
          
          // Dump generated subroutines to ~/.dirac/lib/TIMESTAMP/
          if (iteration === 1) { // Only dump on first successful execution
            dumpGeneratedSubroutines(session, diracCode, userPrompt);
          }
          
          // NEW: Call plugin callback if provided (for monitoring/control)
          const onIterationCallback = element.attributes['on-iteration'];
          if (onIterationCallback && feedbackMode) {
            if (session.debug) {
              console.error(`[LLM] Calling on-iteration plugin: ${onIterationCallback}`);
            }
            
            // Set iteration context variables for callback
            setVariable(session, '__llm_iteration__', iteration.toString(), true);
            setVariable(session, '__llm_max_iterations__', maxIterations.toString(), true);
            
            // Call the plugin subroutine
            const callElement: DiracElement = {
              tag: onIterationCallback,
              attributes: {},
              children: [],
              text: '',
            };
            await integrate(session, callElement);
            
            // Check if plugin requested stop
            const stopRequested = getVariable(session, '__llm_stop_requested__');
            if (stopRequested === 'true') {
              if (session.debug) {
                console.error('[LLM] Plugin requested stop');
              }
              break; // Exit feedback loop
            }
          }
          
          // If feedback mode, capture execution output and send back to LLM
          if (feedbackMode) {
            const outputAfter = session.output.slice();
            const executionOutput = outputAfter.slice(outputBefore.length).join('');
            
            // Display execution output to user immediately
            if (executionOutput) {
              process.stdout.write(executionOutput);
            }
            
            if (session.debug) {
              console.error(`[LLM] Execution output (${executionOutput.length} chars):\n${executionOutput}\n`);
            }
            
            // Build feedback prompt (corrections already added to dialog earlier if any)
            const feedbackPrompt = `The code executed successfully. Here is the output:\n\`\`\`\n${executionOutput}\n\`\`\`\n\nPlease review the output carefully. If the output is correct and complete, respond with ONLY the tag "<DONE />" and nothing else. If the output is incorrect or incomplete, generate corrected Dirac XML code.`;
            
            if (session.debug) {
              console.error(`[LLM] Feedback prompt:\n${feedbackPrompt}\n`);
            }
            
            // Add feedback to dialog history
            dialogHistory.push({ role: 'user', content: feedbackPrompt });
            
            // Get LLM's assessment
            if (isOpenAI) {
              const response = await llmClient.chat.completions.create({
                model,
                max_tokens: maxTokens,
                temperature,
                messages: dialogHistory,
              });
              result = response.choices[0]?.message?.content || '';
            } else if (isOllama) {
              const ollamaPrompt = dialogHistory.map(m => `${m.role.charAt(0).toUpperCase() + m.role.slice(1)}: ${m.content}`).join('\n');
              result = await llmClient.complete(ollamaPrompt, {
                model,
                temperature,
                max_tokens: maxTokens,
              });
            } else if (isCustom) {
              const customPrompt = dialogHistory.map(m => `${m.role}: ${m.content}`).join('\n');
              result = await llmClient.complete(customPrompt, {
                model,
                temperature,
                max_tokens: maxTokens,
                messages: dialogHistory,
              });
            } else {
              result = await callAnthropic(llmClient, model, maxTokens, temperature, dialogHistory);
            }
            
            // Add response to dialog history
            dialogHistory.push({ role: 'assistant', content: result });
            
            // Update context variable if present (store as JSON string, not object)
            if (contextVar) {
              setVariable(session, contextVar, JSON.stringify(dialogHistory), true);
            } else if (saveDialog) {
              setVariable(session, '__llm_dialog__', JSON.stringify(dialogHistory), true);
            }
            
            if (session.debug) {
              console.error(`[LLM] Feedback response:\n${result}\n`);
            }
            
            // Check if LLM says we're done (look for <DONE /> tag)
            const trimmedResult = result.trim();
            if (trimmedResult.includes('<DONE />') || trimmedResult.includes('<DONE/>')) {
              if (session.debug) {
                console.error(`[LLM] Feedback loop terminating - LLM indicated completion with <DONE />\n`);
              }
              break;
            }
            
            // Otherwise, continue to next iteration with new LLM response
          } else {
            // No feedback mode, exit after first execution
            break;
          }
          
        } catch (parseError) {
          console.error(`[LLM] Iteration ${iteration}: ERROR CAUGHT: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
          
          // Check if this is a validation error (not XML parse error)
          const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
          const isValidationError = errorMsg.includes('Tag validation failed') || 
                                    errorMsg.includes('Attribute') || 
                                    errorMsg.includes('contains <variable> tag');
          
          // In feedback mode, send validation errors back to LLM for correction
          if (isValidationError && feedbackMode && iteration < maxIterations) {
            console.error(`[LLM] Iteration ${iteration}: VALIDATION ERROR - sending to LLM for correction`);
            
            const errorFeedback = `System: Your code had validation errors:\n${errorMsg}\n\nPlease fix these errors and generate valid Dirac XML code. Remember:\n- Use \${varname} syntax in attributes instead of <variable name="..." /> tags\n- Only use allowed tags and attributes`;
            dialogHistory.push({ role: 'user', content: errorFeedback });
            
            // Update dialog variable
            if (contextVar) {
              setVariable(session, contextVar, JSON.stringify(dialogHistory), true);
            } else if (saveDialog) {
              setVariable(session, '__llm_dialog__', JSON.stringify(dialogHistory), true);
            }
            
            // Call LLM to get fixed code
            if (isOpenAI) {
              const response = await llmClient.chat.completions.create({
                model,
                max_tokens: maxTokens,
                temperature,
                messages: dialogHistory,
              });
              result = response.choices[0]?.message?.content || '';
            } else if (isOllama) {
              const ollamaPrompt = dialogHistory.map(m => `${m.role.charAt(0).toUpperCase() + m.role.slice(1)}: ${m.content}`).join('\n');
              result = await llmClient.complete(ollamaPrompt, {
                model,
                temperature,
                max_tokens: maxTokens,
              });
            } else if (isCustom) {
              const customPrompt = dialogHistory.map(m => `${m.role}: ${m.content}`).join('\n');
              result = await llmClient.complete(customPrompt, {
                model,
                temperature,
                max_tokens: maxTokens,
                messages: dialogHistory,
              });
            } else {
              result = await callAnthropic(llmClient, model, maxTokens, temperature, dialogHistory);
            }
            
            // Add new response to dialog
            dialogHistory.push({ role: 'assistant', content: result });
            
            // Update dialog variable
            if (contextVar) {
              setVariable(session, contextVar, JSON.stringify(dialogHistory), true);
            } else if (saveDialog) {
              setVariable(session, '__llm_dialog__', JSON.stringify(dialogHistory), true);
            }
            
            if (session.debug) {
              console.error(`[LLM] LLM correction response:\n${result}\n`);
            }
            
            // Continue to next iteration to process the corrected response
            continue;
          } else {
            // Actual parse error or no feedback mode - treat as text
            console.error(`[LLM] Iteration ${iteration}: PARSE ERROR (or no feedback): ${errorMsg}`);
            if (session.debug) {
              console.error(`[LLM] Failed to parse as Dirac, treating as text: ${parseError}`);
            }
            emit(session, result);
            break; // Exit feedback loop
          }
        }
      } // end while loop
      
      console.error(`[LLM] Exited feedback loop after ${iteration} iterations`);
    } else {
      // Otherwise emit to output as text
      emit(session, result);
    }
    
  } catch (error) {
    throw new Error(`LLM error: ${error instanceof Error ? error.message : String(error)}`);
  }
}


